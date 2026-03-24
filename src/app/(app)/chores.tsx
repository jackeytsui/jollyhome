import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoreCard } from '@/components/chores/ChoreCard';
import { ChoreEditorSheet, type ChoreEditorValues } from '@/components/chores/ChoreEditorSheet';
import { ChoreFiltersBar, type ChoreFilterState } from '@/components/chores/ChoreFiltersBar';
import { ChoreSection } from '@/components/chores/ChoreSection';
import { CompleteChoreSheet, type CompleteChoreValues } from '@/components/chores/CompleteChoreSheet';
import { FairnessSummaryCard } from '@/components/chores/FairnessSummaryCard';
import { EnergyLevelCard } from '@/components/chores/EnergyLevelCard';
import { GamificationCard } from '@/components/chores/GamificationCard';
import { RotationReviewSheet, type RotationReviewItem } from '@/components/chores/RotationReviewSheet';
import { RotationSuggestionCard } from '@/components/chores/RotationSuggestionCard';
import { getConditionProgress, rankChoresForEnergy } from '@/lib/condition';
import { buildFairnessStats, getRollingAverageMinutes } from '@/lib/fairness';
import { parseRecurrenceRule } from '@/lib/recurrence';
import { useChoreRotation } from '@/hooks/useChoreRotation';
import { useChores } from '@/hooks/useChores';
import { buildChoreSupplyWarnings, useInventory } from '@/hooks/useInventory';
import { useMembers } from '@/hooks/useMembers';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';

type DisplayChore = {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  area: string | null;
  estimatedMinutes: number;
  assigneeNames: string[];
  assignedMemberIds: string[];
  conditionLabel: string;
  conditionState: 'green' | 'yellow' | 'red';
  conditionProgress: number;
  status: 'open' | 'claimed' | 'completed' | 'skipped';
  kind: 'responsibility' | 'bonus';
  claimedBy: string | null;
  scheduledFor: string | null;
  recurrenceRule: string | null;
  recurrenceTimezone: string;
  recurrenceAnchor: string;
  supplyWarnings: Array<{ title: string; detail: string }>;
};

const DEFAULT_FILTERS: ChoreFilterState = {
  assigneeId: 'all',
  area: 'all',
  status: 'all',
  urgency: 'all',
};

function startOfTodayIso() {
  const value = new Date();
  value.setHours(8, 0, 0, 0);
  return value.toISOString();
}

function toConditionLabel(state: 'green' | 'yellow' | 'red') {
  if (state === 'red') {
    return 'Needs attention';
  }

  if (state === 'yellow') {
    return 'Coming up';
  }

  return 'In good shape';
}

function getTargetIntervalMinutes(recurrenceRule: string | null): number {
  if (!recurrenceRule) {
    return 7 * 24 * 60;
  }

  const parsed = parseRecurrenceRule(recurrenceRule);
  if (parsed.frequency === 'daily') {
    return parsed.interval * 24 * 60;
  }

  if (parsed.frequency === 'weekly') {
    const weekdayCount = parsed.byWeekday.length || 1;
    return Math.max(1, Math.round((parsed.interval * 7 * 24 * 60) / weekdayCount));
  }

  if (parsed.frequency === 'monthly') {
    return parsed.interval * 30 * 24 * 60;
  }

  return parsed.interval * 365 * 24 * 60;
}

function sortChores(left: DisplayChore, right: DisplayChore) {
  const urgencyRank = { red: 0, yellow: 1, green: 2 };
  const rankDiff = urgencyRank[left.conditionState] - urgencyRank[right.conditionState];
  if (rankDiff !== 0) {
    return rankDiff;
  }

  const areaDiff = (left.area ?? 'zzzz').localeCompare(right.area ?? 'zzzz');
  if (areaDiff !== 0) {
    return areaDiff;
  }

  const assigneeDiff = (left.assigneeNames[0] ?? 'zzzz').localeCompare(right.assigneeNames[0] ?? 'zzzz');
  if (assigneeDiff !== 0) {
    return assigneeDiff;
  }

  return left.title.localeCompare(right.title);
}

function matchesFilters(chore: DisplayChore, filters: ChoreFilterState) {
  if (filters.assigneeId !== 'all' && !chore.assignedMemberIds.includes(filters.assigneeId)) {
    return false;
  }

  if (filters.area !== 'all' && (chore.area ?? 'Unassigned') !== filters.area) {
    return false;
  }

  if (filters.status !== 'all') {
    if (filters.status === 'bonus' && chore.kind !== 'bonus') {
      return false;
    }

    if (filters.status !== 'bonus' && chore.status !== filters.status) {
      return false;
    }
  }

  if (filters.urgency !== 'all' && chore.conditionState !== filters.urgency) {
    return false;
  }

  return true;
}

function areRotationDraftsEqual(left: RotationReviewItem[], right: RotationReviewItem[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const candidate = right[index];
    if (!candidate) {
      return false;
    }

    return (
      item.choreInstanceId === candidate.choreInstanceId &&
      item.templateId === candidate.templateId &&
      item.title === candidate.title &&
      item.recommendedMemberId === candidate.recommendedMemberId &&
      item.estimatedEffortMinutes === candidate.estimatedEffortMinutes &&
      item.rationale.join('|') === candidate.rationale.join('|')
    );
  });
}

export default function ChoresScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState<ChoreFilterState>(DEFAULT_FILTERS);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingChore, setEditingChore] = useState<DisplayChore | null>(null);
  const [completingChore, setCompletingChore] = useState<DisplayChore | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [energySaving, setEnergySaving] = useState(false);
  const [gamificationSaving, setGamificationSaving] = useState(false);
  const [rotationReviewVisible, setRotationReviewVisible] = useState(false);
  const [rotationApplying, setRotationApplying] = useState(false);
  const [rotationRefreshing, setRotationRefreshing] = useState(false);
  const [rotationDraft, setRotationDraft] = useState<RotationReviewItem[]>([]);
  const [defaultAnchor] = useState(() => startOfTodayIso());
  const { activeHouseholdId } = useHouseholdStore();
  const user = useAuthStore((state) => state.user);
  const {
    templates,
    assignments,
    instances,
    completions,
    energyEntries,
    settings,
    loading,
    error,
    createChore,
    updateChore,
    completeChore,
    claimBonusChore,
    upsertEnergyEntry,
    updateHouseholdSettings,
  } = useChores();
  const { catalogItems, lowStockAlerts } = useInventory();
  const { members, loadMembers } = useMembers(activeHouseholdId);
  const { suggestions, refreshSuggestions, applySuggestions } = useChoreRotation();

  useEffect(() => {
    if (activeHouseholdId) {
      loadMembers();
    }
  }, [activeHouseholdId, loadMembers]);

  const chores = useMemo<DisplayChore[]>(() => {
    const memberNameMap = new Map(
      members.map((member) => [
        member.user_id,
        member.profile.display_name ?? 'Housemate',
      ])
    );

    return instances
      .map((instance) => {
        const template = templates.find((item) => item.id === instance.template_id);
        if (!template) {
          return null;
        }

        const choreAssignments = assignments.filter((assignment) => {
          if (assignment.instance_id) {
            return assignment.instance_id === instance.id;
          }

          return assignment.template_id === template.id;
        });

        const latestCompletion = completions.find((completion) => completion.instance_id === instance.id)
          ?? completions.find((completion) => completion.template_id === template.id);

        const progress = getConditionProgress({
          lastCompletedAt: template.last_completed_at,
          now: new Date().toISOString(),
          targetIntervalMinutes: getTargetIntervalMinutes(template.recurrence_rule),
        });

        return {
          id: instance.id,
          templateId: template.id,
          title: template.title,
          description: template.description,
          area: template.area,
          estimatedMinutes: template.estimated_minutes,
          assigneeNames: choreAssignments.length > 0
            ? choreAssignments.map((assignment) => memberNameMap.get(assignment.member_user_id) ?? 'Housemate')
            : ['Unassigned'],
          assignedMemberIds: choreAssignments.map((assignment) => assignment.member_user_id),
          conditionLabel: latestCompletion?.condition_state_at_completion
            ? toConditionLabel(latestCompletion.condition_state_at_completion)
            : toConditionLabel(progress.state),
          conditionState: progress.state,
          conditionProgress: progress.ratio,
          status: instance.status,
          kind: template.kind,
          claimedBy: instance.claimed_by,
          scheduledFor: instance.scheduled_for,
          recurrenceRule: template.recurrence_rule,
          recurrenceTimezone: template.recurrence_timezone,
          recurrenceAnchor: template.recurrence_anchor,
          supplyWarnings: buildChoreSupplyWarnings({
            title: template.title,
            area: template.area,
            catalogItems,
            lowStockAlerts,
          }).map((warning) => ({
            title: warning.title,
            detail: warning.detail,
          })),
        };
      })
      .filter((item): item is DisplayChore => Boolean(item))
      .sort(sortChores);
  }, [assignments, catalogItems, completions, instances, lowStockAlerts, members, templates]);

  const filteredChores = useMemo(
    () => chores.filter((chore) => matchesFilters(chore, filters)),
    [chores, filters]
  );

  const currentEnergyLevel = useMemo(() => {
    if (!user?.id) {
      return 'medium' as const;
    }

    const today = new Date().toISOString().slice(0, 10);
    const todaysEntry = energyEntries.find(
      (entry) => entry.member_user_id === user.id && entry.effective_date === today
    );

    return todaysEntry?.energy_level ?? 'medium';
  }, [energyEntries, user?.id]);

  const myChores = useMemo(() => {
    const personal = filteredChores.filter(
      (chore) => chore.assignedMemberIds.includes(user?.id ?? '') || chore.assigneeNames[0] === 'Unassigned'
    );

    const ranking = rankChoresForEnergy(
      personal.map((chore) => ({
        id: chore.id,
        title: chore.title,
        estimatedMinutes: chore.estimatedMinutes,
        conditionState: chore.conditionState,
        conditionScore: chore.conditionProgress,
      })),
      currentEnergyLevel
    );

    const rankedIds = new Map(ranking.map((item, index) => [item.id, index]));

    return [...personal].sort(
      (left, right) => (rankedIds.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (rankedIds.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    );
  }, [currentEnergyLevel, filteredChores, user?.id]);

  const householdChores = useMemo(
    () => filteredChores.filter((chore) => !myChores.some((candidate) => candidate.id === chore.id)),
    [filteredChores, myChores]
  );

  const assigneeOptions = useMemo(
    () => members
      .filter((member) => member.status === 'active')
      .map((member) => ({
        label: member.profile.display_name ?? 'Housemate',
        value: member.user_id,
      })),
    [members]
  );

  const rotationMemberOptions = useMemo(
    () => members
      .filter((member) => member.status === 'active')
      .map((member) => ({
        id: member.user_id,
        label: member.profile.display_name ?? 'Housemate',
      })),
    [members]
  );

  const memberNameMap = useMemo(
    () => new Map(members.map((member) => [member.user_id, member.profile.display_name ?? 'Housemate'])),
    [members]
  );

  const rotationItems = useMemo<RotationReviewItem[]>(
    () =>
      suggestions.map((suggestion) => ({
        choreInstanceId: suggestion.choreInstanceId,
        templateId: suggestion.templateId,
        title: suggestion.title,
        recommendedMemberId: suggestion.recommendedMemberId,
        estimatedEffortMinutes: suggestion.estimatedEffortMinutes,
        rationale: suggestion.rationale,
      })),
    [suggestions]
  );

  useEffect(() => {
    setRotationDraft((current) => (areRotationDraftsEqual(current, rotationItems) ? current : rotationItems));
  }, [rotationItems]);

  const areaOptions = useMemo(
    () => Array.from(new Set(chores.map((chore) => chore.area ?? 'Unassigned'))).sort(),
    [chores]
  );

  const fairnessMembers = useMemo(() => {
    if (!activeHouseholdId) {
      return [];
    }

    const memberNameMap = new Map(
      members.map((member) => [member.user_id, member.profile.display_name ?? 'Housemate'])
    );
    const stats = buildFairnessStats({
      householdId: activeHouseholdId,
      windowEnd: new Date().toISOString(),
      completions: completions.map((completion) => ({
        householdId: completion.household_id,
        templateId: completion.template_id,
        completedBy: completion.completed_by,
        completedAt: completion.completed_at,
        actualMinutes: completion.actual_minutes,
      })),
    });
    const totalTasks = stats.reduce((sum, stat) => sum + stat.completedTaskCount, 0);
    const averageTaskCount = stats.length > 0 ? totalTasks / stats.length : 0;

    return stats.map((stat) => ({
      memberId: stat.memberId,
      memberName: memberNameMap.get(stat.memberId) ?? 'Housemate',
      completedTaskCount: stat.completedTaskCount,
      completedMinutes: stat.completedMinutes,
      averageMinutes: getRollingAverageMinutes(stats, {
        memberId: stat.memberId,
        window: '30d',
      }),
      taskDelta: Math.round(stat.completedTaskCount - averageTaskCount),
      minuteDelta: Math.round(stat.fairnessDelta),
    }));
  }, [activeHouseholdId, completions, members]);

  const gamificationEnabled = Boolean(
    settings?.gamification_enabled && settings?.streaks_enabled && settings?.leaderboard_enabled
  );

  const leaderboard = useMemo(() => {
    const memberNameMap = new Map(
      members.map((member) => [member.user_id, member.profile.display_name ?? 'Housemate'])
    );
    const completionsByMember = new Map<string, Array<typeof completions[number]>>();

    for (const completion of completions) {
      const existing = completionsByMember.get(completion.completed_by) ?? [];
      existing.push(completion);
      completionsByMember.set(completion.completed_by, existing);
    }

    return [...completionsByMember.entries()]
      .map(([memberId, memberCompletions]) => ({
        memberId,
        memberName: memberNameMap.get(memberId) ?? 'Housemate',
        points: memberCompletions.reduce(
          (sum, completion) => sum + 10 + Math.round((completion.actual_minutes ?? 0) / 5),
          0
        ),
        streakDays: new Set(memberCompletions.map((completion) => completion.completed_at.slice(0, 10))).size,
      }))
      .sort((left, right) => right.points - left.points);
  }, [completions, members]);

  async function handleSave(values: ChoreEditorValues) {
    setSubmitting(true);

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      estimated_minutes: values.estimatedMinutes,
      area: values.area.trim() || null,
      kind: values.kind,
      recurrence_rule: values.recurrenceRule,
      recurrence_timezone: values.recurrenceTimezone,
      recurrence_anchor: values.recurrenceAnchor,
      next_occurrence_at: values.nextOccurrenceAt,
      assignedMemberIds: values.assignedMemberIds,
    };

    try {
      if (editingChore) {
        await updateChore(editingChore.templateId, payload);
      } else {
        await createChore(payload);
      }

      setEditorVisible(false);
      setEditingChore(null);
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateSheet() {
    setEditingChore(null);
    setEditorVisible(true);
  }

  async function handleClaimBonus(instanceId: string) {
    setClaimingId(instanceId);

    try {
      await claimBonusChore(instanceId);
    } finally {
      setClaimingId(null);
    }
  }

  async function handleComplete(values: CompleteChoreValues) {
    if (!completingChore) {
      return;
    }

    setSubmitting(true);

    try {
      await completeChore(completingChore.id, {
        actual_minutes: values.actualMinutes,
        note: values.note || completingChore.supplyWarnings[0]?.detail || null,
        photo_path: values.photoPath || null,
        condition_state: completingChore.conditionState,
      });

      setCompletingChore(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnergyChange(value: 'low' | 'medium' | 'high') {
    setEnergySaving(true);

    try {
      await upsertEnergyEntry({
        energy_level: value,
        effective_date: new Date().toISOString().slice(0, 10),
      });
    } finally {
      setEnergySaving(false);
    }
  }

  async function handleGamificationToggle(enabled: boolean) {
    setGamificationSaving(true);

    try {
      await updateHouseholdSettings({
        gamification_enabled: enabled,
        streaks_enabled: enabled,
        leaderboard_enabled: enabled,
      });
    } finally {
      setGamificationSaving(false);
    }
  }

  function openRotationReview() {
    setRotationDraft(rotationItems);
    setRotationReviewVisible(true);
  }

  function handleRotationAssigneeChange(choreInstanceId: string, memberId: string) {
    setRotationDraft((current) =>
      current.map((item) =>
        item.choreInstanceId === choreInstanceId
          ? { ...item, recommendedMemberId: memberId }
          : item
      )
    );
  }

  async function handleRotationRefresh() {
    setRotationRefreshing(true);

    try {
      await refreshSuggestions();
    } finally {
      setRotationRefreshing(false);
    }
  }

  async function handleRotationConfirm() {
    setRotationApplying(true);

    try {
      await applySuggestions(rotationDraft);
      setRotationReviewVisible(false);
    } finally {
      setRotationApplying(false);
    }
  }

  const editorInitialValues: Partial<ChoreEditorValues> | undefined = editingChore
    ? {
        title: editingChore.title,
        description: editingChore.description ?? '',
        area: editingChore.area ?? '',
        estimatedMinutes: editingChore.estimatedMinutes,
        kind: editingChore.kind,
        assignedMemberIds: editingChore.assignedMemberIds,
        recurrenceRule: editingChore.recurrenceRule,
        recurrenceTimezone: editingChore.recurrenceTimezone,
        recurrenceAnchor: editingChore.recurrenceAnchor,
        nextOccurrenceAt: editingChore.scheduledFor,
      }
    : undefined;

  const totalVisible = filteredChores.length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heading}>Chores</Text>
            <Text style={styles.subheading}>
              Keep urgent work visible first, then scan the whole household below.
            </Text>
          </View>
          <View style={styles.heroAction}>
            <Button label="New chore" onPress={openCreateSheet} />
          </View>
        </View>

        <ChoreFiltersBar
          filters={filters}
          assigneeOptions={assigneeOptions}
          areaOptions={areaOptions}
          onChange={setFilters}
        />

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{totalVisible} chores in view</Text>
          <Text style={styles.summaryBody}>
            Urgent chores stay at the top, then the list settles by area and assignee.
          </Text>
        </Card>

        {rotationDraft.length > 0 ? (
          <>
            <View style={styles.rotationHeader}>
              <View style={styles.rotationHeaderCopy}>
                <Text style={styles.rotationTitle}>Assistive rotation</Text>
                <Text style={styles.rotationBody}>
                  Suggestions rebalance from live availability, attendance, learned duration, and active roster changes.
                </Text>
              </View>
              <View style={styles.rotationHeaderAction}>
                <Button label="Review AI rotation" variant="secondary" onPress={openRotationReview} />
              </View>
            </View>

            {rotationDraft.slice(0, 2).map((item) => (
              <RotationSuggestionCard
                key={item.choreInstanceId}
                title={item.title}
                assigneeName={memberNameMap.get(item.recommendedMemberId ?? '') ?? 'Unassigned'}
                estimatedEffortMinutes={item.estimatedEffortMinutes}
                rationale={item.rationale}
                onPress={openRotationReview}
              />
            ))}
          </>
        ) : null}

        <EnergyLevelCard
          value={currentEnergyLevel}
          loading={energySaving}
          onChange={handleEnergyChange}
        />

        <FairnessSummaryCard members={fairnessMembers} />

        <GamificationCard
          enabled={gamificationEnabled}
          loading={gamificationSaving}
          leaderboard={leaderboard}
          onToggle={handleGamificationToggle}
        />

        {!activeHouseholdId ? (
          <Card>
            <Text style={styles.emptyTitle}>Choose a household to start assigning chores.</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <ChoreSection
          title="My chores today"
          subtitle="Your assigned chores and anything still waiting to be claimed."
          chores={myChores}
          emptyText={loading ? 'Loading chores...' : 'Nothing assigned to you yet.'}
          renderItem={(chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              warning={chore.supplyWarnings[0] ?? null}
              onPress={() => router.push(`/chores/${chore.templateId}`)}
              footer={(
                <View style={styles.cardActions}>
                  {chore.kind === 'bonus' && chore.status === 'open' ? (
                    <Button
                      label="Claim bonus"
                      variant="secondary"
                      loading={claimingId === chore.id}
                      onPress={() => handleClaimBonus(chore.id)}
                    />
                  ) : null}
                  {(chore.kind !== 'bonus' || chore.claimedBy === user?.id || chore.status !== 'open') && chore.status !== 'completed' ? (
                    <Button
                      label="Complete"
                      onPress={() => setCompletingChore(chore)}
                    />
                  ) : null}
                </View>
              )}
            />
          )}
        />

        <ChoreSection
          title="Household queue"
          subtitle="Everything else happening across the home."
          chores={householdChores}
          emptyText={loading ? 'Loading household chores...' : 'The whole-household queue is clear.'}
          renderItem={(chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              warning={chore.supplyWarnings[0] ?? null}
              onPress={() => router.push(`/chores/${chore.templateId}`)}
              footer={(
                <View style={styles.cardActions}>
                  {chore.kind === 'bonus' && chore.status === 'open' ? (
                    <Button
                      label="Claim bonus"
                      variant="secondary"
                      loading={claimingId === chore.id}
                      onPress={() => handleClaimBonus(chore.id)}
                    />
                  ) : null}
                  {(chore.kind !== 'bonus' || chore.claimedBy === user?.id || chore.status !== 'open') && chore.status !== 'completed' ? (
                    <Button
                      label="Complete"
                      onPress={() => setCompletingChore(chore)}
                    />
                  ) : null}
                </View>
              )}
            />
          )}
        />
      </ScrollView>

      <ChoreEditorSheet
        visible={editorVisible}
        initialValues={editorInitialValues}
        members={members
          .filter((member) => member.status === 'active')
          .map((member) => ({
            id: member.user_id,
            name: member.profile.display_name ?? 'Housemate',
          }))}
        loading={submitting}
        onClose={() => {
          setEditorVisible(false);
          setEditingChore(null);
        }}
        onSubmit={handleSave}
        defaultAnchor={defaultAnchor}
      />
      <CompleteChoreSheet
        visible={Boolean(completingChore)}
        choreTitle={completingChore?.title ?? ''}
        supplyPrompt={completingChore?.supplyWarnings[1]?.detail ?? completingChore?.supplyWarnings[0]?.detail ?? null}
        loading={submitting}
        onClose={() => setCompletingChore(null)}
        onSubmit={handleComplete}
      />
      <RotationReviewSheet
        visible={rotationReviewVisible}
        items={rotationDraft}
        memberOptions={rotationMemberOptions}
        loading={rotationApplying}
        refreshing={rotationRefreshing}
        onClose={() => setRotationReviewVisible(false)}
        onChangeAssignee={handleRotationAssigneeChange}
        onRefresh={() => {
          void handleRotationRefresh();
        }}
        onConfirm={() => {
          void handleRotationConfirm();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroAction: {
    minWidth: 120,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
  summaryCard: {
    gap: 4,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  rotationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  rotationHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  rotationHeaderAction: {
    minWidth: 148,
  },
  rotationTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.textPrimary.light,
  },
  rotationBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.destructive.light,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
