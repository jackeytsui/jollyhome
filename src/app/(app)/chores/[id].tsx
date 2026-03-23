import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { FairnessSummaryCard } from '@/components/chores/FairnessSummaryCard';
import { colors } from '@/constants/theme';
import { useChores } from '@/hooks/useChores';
import { useMembers } from '@/hooks/useMembers';
import { buildFairnessStats, getRollingAverageMinutes } from '@/lib/fairness';
import { useHouseholdStore } from '@/stores/household';

function formatDate(value: string | null) {
  if (!value) {
    return 'No date recorded';
  }

  return new Date(value).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function groupTaskCounts(completedBy: string[]) {
  const counts = new Map<string, number>();

  for (const memberId of completedBy) {
    counts.set(memberId, (counts.get(memberId) ?? 0) + 1);
  }

  return counts;
}

export default function ChoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { activeHouseholdId } = useHouseholdStore();
  const { templates, instances, completions, assignments } = useChores();
  const { members } = useMembers(activeHouseholdId);

  const memberNameMap = useMemo(
    () => new Map(
      members.map((member) => [member.user_id, member.profile.display_name ?? 'Housemate'])
    ),
    [members]
  );

  const detail = useMemo(() => {
    const template = templates.find((candidate) => candidate.id === id);
    if (!template || !activeHouseholdId) {
      return null;
    }

    const templateInstanceIds = instances
      .filter((instance) => instance.template_id === template.id)
      .map((instance) => instance.id);

    const history = completions
      .filter((completion) => completion.template_id === template.id || templateInstanceIds.includes(completion.instance_id))
      .sort((left, right) => new Date(right.completed_at).getTime() - new Date(left.completed_at).getTime());

    const fairnessStats = buildFairnessStats({
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

    const taskCounts = groupTaskCounts(
      completions
        .filter((completion) => completion.household_id === activeHouseholdId)
        .map((completion) => completion.completed_by)
    );
    const totalTasks = [...taskCounts.values()].reduce((sum, value) => sum + value, 0);
    const averageTaskCount = taskCounts.size > 0 ? totalTasks / taskCounts.size : 0;

    const memberRows = fairnessStats.map((stat) => ({
      memberId: stat.memberId,
      memberName: memberNameMap.get(stat.memberId) ?? 'Housemate',
      completedTaskCount: stat.completedTaskCount,
      completedMinutes: stat.completedMinutes,
      averageMinutes: getRollingAverageMinutes(fairnessStats, {
        memberId: stat.memberId,
        window: '30d',
      }),
      taskDelta: Math.round(stat.completedTaskCount - averageTaskCount),
      minuteDelta: Math.round(stat.fairnessDelta),
    }));

    const activeAssignments = assignments.filter((assignment) => assignment.template_id === template.id);

    return {
      template,
      history,
      memberRows,
      assigneeNames: activeAssignments.length > 0
        ? activeAssignments.map((assignment) => memberNameMap.get(assignment.member_user_id) ?? 'Housemate')
        : ['Unassigned'],
    };
  }, [activeHouseholdId, assignments, completions, id, instances, memberNameMap, templates]);

  if (!detail) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyWrap}>
          <Text style={styles.heading}>Chore details</Text>
          <Text style={styles.subheading}>Pick a chore from the main list to inspect history and fairness.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heading}>{detail.template.title}</Text>
          <Text style={styles.subheading}>
            {detail.assigneeNames.join(', ')} • {detail.template.area ?? 'Unassigned area'} • {detail.template.estimated_minutes} min
          </Text>
        </View>

        <FairnessSummaryCard
          title="Household fairness"
          subtitle="Track both task counts and time spent so the detail screen carries the deeper load."
          members={detail.memberRows}
        />

        <Card style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Completion History</Text>
          <Text style={styles.sectionCopy}>Recent finishes, notes, and actual time help the household inspect what really happened.</Text>

          {detail.history.length === 0 ? (
            <Text style={styles.emptyText}>No completions yet for this chore.</Text>
          ) : (
            detail.history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyName}>{memberNameMap.get(entry.completed_by) ?? 'Housemate'}</Text>
                  <Text style={styles.historyMeta}>{formatDate(entry.completed_at)}</Text>
                </View>
                <Text style={styles.historyMeta}>
                  {entry.actual_minutes ?? detail.template.estimated_minutes} min • {entry.condition_state_at_completion ?? 'Condition not captured'}
                </Text>
                {entry.note ? <Text style={styles.historyNote}>{entry.note}</Text> : null}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
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
  emptyWrap: {
    padding: 16,
    gap: 8,
  },
  hero: {
    gap: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.textPrimary.light,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
  historyCard: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.textPrimary.light,
  },
  sectionCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  historyRow: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  historyMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  historyNote: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary.light,
  },
});
