import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoreCard } from '@/components/chores/ChoreCard';
import { ChoreEditorSheet, type ChoreEditorValues } from '@/components/chores/ChoreEditorSheet';
import { ChoreFiltersBar, type ChoreFilterState } from '@/components/chores/ChoreFiltersBar';
import { ChoreSection } from '@/components/chores/ChoreSection';
import { CompleteChoreSheet, type CompleteChoreValues } from '@/components/chores/CompleteChoreSheet';
import { getConditionProgress } from '@/lib/condition';
import { parseRecurrenceRule } from '@/lib/recurrence';
import { useChores } from '@/hooks/useChores';
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

export default function ChoresScreen() {
  const [filters, setFilters] = useState<ChoreFilterState>(DEFAULT_FILTERS);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingChore, setEditingChore] = useState<DisplayChore | null>(null);
  const [completingChore, setCompletingChore] = useState<DisplayChore | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [defaultAnchor] = useState(() => startOfTodayIso());
  const { activeHouseholdId } = useHouseholdStore();
  const user = useAuthStore((state) => state.user);
  const {
    templates,
    assignments,
    instances,
    completions,
    loading,
    error,
    createChore,
    updateChore,
    completeChore,
    claimBonusChore,
  } = useChores();
  const { members, loadMembers } = useMembers(activeHouseholdId);

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
        };
      })
      .filter((item): item is DisplayChore => Boolean(item))
      .sort(sortChores);
  }, [assignments, completions, instances, members, templates]);

  const filteredChores = useMemo(
    () => chores.filter((chore) => matchesFilters(chore, filters)),
    [chores, filters]
  );

  const myChores = useMemo(
    () => filteredChores.filter((chore) => chore.assignedMemberIds.includes(user?.id ?? '') || chore.assigneeNames[0] === 'Unassigned'),
    [filteredChores, user?.id]
  );

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

  const areaOptions = useMemo(
    () => Array.from(new Set(chores.map((chore) => chore.area ?? 'Unassigned'))).sort(),
    [chores]
  );

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

  function openEditSheet(chore: DisplayChore) {
    setEditingChore(chore);
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
        note: values.note || null,
        photo_path: values.photoPath || null,
        condition_state: completingChore.conditionState,
      });

      setCompletingChore(null);
    } finally {
      setSubmitting(false);
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
              onPress={() => openEditSheet(chore)}
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
              onPress={() => openEditSheet(chore)}
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
        loading={submitting}
        onClose={() => setCompletingChore(null)}
        onSubmit={handleComplete}
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
