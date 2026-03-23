import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildFairnessStats, getRollingAverageMinutes } from '@/lib/fairness';
import {
  rebalanceSuggestions,
  type RotationContext,
  type RotationSuggestion,
  scoreRotationSuggestions,
} from '@/lib/choreRotation';
import { useAttendance } from '@/hooks/useAttendance';
import { useCalendar } from '@/hooks/useCalendar';
import { useChores } from '@/hooks/useChores';
import { useMembers } from '@/hooks/useMembers';
import { useHouseholdStore } from '@/stores/household';

function getDateKey(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null;
}

interface MemberChorePreferenceRecord {
  member_user_id: string;
  template_id: string | null;
  area: string | null;
  preference_score: number;
  preferred: boolean;
}

function clampPreferenceScore(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function getPreferenceValue(row: MemberChorePreferenceRecord) {
  const baseScore = Number(row.preference_score ?? 0);
  const preferredBoost = row.preferred ? 0.25 : 0;
  return clampPreferenceScore(baseScore + preferredBoost);
}

function averagePreferenceValues(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return clampPreferenceScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildPreferenceMaps(rows: MemberChorePreferenceRecord[]) {
  const grouped = new Map<string, {
    templateScores: Map<string, number[]>;
    areaScores: Map<string, number[]>;
    fallbackScores: number[];
  }>();

  for (const row of rows) {
    const value = getPreferenceValue(row);
    const entry = grouped.get(row.member_user_id) ?? {
      templateScores: new Map<string, number[]>(),
      areaScores: new Map<string, number[]>(),
      fallbackScores: [],
    };

    entry.fallbackScores.push(value);

    if (row.template_id) {
      const templateValues = entry.templateScores.get(row.template_id) ?? [];
      templateValues.push(value);
      entry.templateScores.set(row.template_id, templateValues);
    }

    if (row.area) {
      const areaValues = entry.areaScores.get(row.area) ?? [];
      areaValues.push(value);
      entry.areaScores.set(row.area, areaValues);
    }

    grouped.set(row.member_user_id, entry);
  }

  return new Map(
    Array.from(grouped.entries()).map(([memberId, entry]) => [
      memberId,
      {
        preferenceScore: averagePreferenceValues(entry.fallbackScores),
        preferenceScoresByTemplate: Object.fromEntries(
          Array.from(entry.templateScores.entries()).map(([templateId, values]) => [
            templateId,
            averagePreferenceValues(values),
          ])
        ),
        preferenceScoresByArea: Object.fromEntries(
          Array.from(entry.areaScores.entries()).map(([area, values]) => [
            area,
            averagePreferenceValues(values),
          ])
        ),
      },
    ])
  );
}

export function useChoreRotation() {
  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const chores = useChores();
  const attendanceState = useAttendance();
  const calendar = useCalendar();
  const { members, loadMembers } = useMembers(activeHouseholdId);
  const [preferences, setPreferences] = useState<MemberChorePreferenceRecord[]>([]);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const loadPreferences = useCallback(async (): Promise<MemberChorePreferenceRecord[]> => {
    if (!activeHouseholdId) {
      setPreferences([]);
      setPreferencesError(null);
      return [];
    }

    setPreferencesLoading(true);
    setPreferencesError(null);

    try {
      const { data, error } = await supabase
        .from('member_chore_preferences')
        .select('member_user_id, template_id, area, preference_score, preferred')
        .eq('household_id', activeHouseholdId);

      if (error) {
        throw error;
      }

      const rows = (data as MemberChorePreferenceRecord[] | null) ?? [];
      setPreferences(rows);
      return rows;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chore preferences';
      setPreferencesError(message);
      return [];
    } finally {
      setPreferencesLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const preferenceMaps = useMemo(() => buildPreferenceMaps(preferences), [preferences]);

  const context = useMemo<RotationContext>(() => {
    const openInstances = chores.instances.filter((instance) => instance.status === 'open' || instance.status === 'claimed');
    const activeMembers = members.filter((member) => member.status === 'active');
    const fairness = buildFairnessStats({
      householdId: activeHouseholdId ?? '',
      windowEnd: new Date().toISOString(),
      completions: chores.completions.map((completion) => ({
        householdId: completion.household_id,
        templateId: completion.template_id,
        completedBy: completion.completed_by,
        completedAt: completion.completed_at,
        actualMinutes: completion.actual_minutes,
      })),
    });
    const today = new Date().toISOString().slice(0, 10);

    return {
      chores: openInstances.map((instance) => {
        const template = chores.templates.find((item) => item.id === instance.template_id);

        return {
          instanceId: instance.id,
          templateId: instance.template_id,
          title: template?.title ?? 'Chore',
          area: template?.area ?? null,
          estimatedMinutes: template?.estimated_minutes ?? 15,
        };
      }),
      members: activeMembers.map((member) => {
        const attendanceEntry = attendanceState.attendance.find(
          (entry) =>
            entry.member_user_id === member.user_id &&
            entry.attendance_date === today
        );
        const energyEntry = chores.energyEntries.find(
          (entry) =>
            entry.member_user_id === member.user_id &&
            entry.effective_date === today
        );
        const memberFairness = fairness.find((item) => item.memberId === member.user_id);
        const calendarConflictMinutes = calendar.items
          .filter((item) => item.memberOwnerIds.includes(member.user_id))
          .filter((item) => {
            const startsAt = getDateKey(item.startsAt);
            return startsAt === today && item.sourceType !== 'attendance';
          })
          .reduce((sum, item) => {
            const duration = new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime();
            return sum + Math.max(0, Math.round(duration / 60000));
          }, 0);

        let availabilityScore = 1 - Math.min(calendarConflictMinutes / 180, 0.7);
        if (attendanceEntry?.status === 'away_tonight') {
          availabilityScore -= 0.35;
        }
        if (energyEntry?.energy_level === 'low') {
          availabilityScore -= 0.15;
        }
        if (energyEntry?.energy_level === 'high') {
          availabilityScore += 0.08;
        }

        return {
          id: member.user_id,
          name: member.profile.display_name ?? 'Housemate',
          active: member.status === 'active',
          availabilityScore: Math.max(0, Math.min(1, availabilityScore)),
          calendarConflictMinutes,
          attendanceStatus: attendanceEntry?.status ?? null,
          trailingTaskCount: memberFairness?.rolling14DayTaskCount ?? 0,
          trailingMinutes: memberFairness?.rolling14DayMinutes ?? 0,
          learnedAverageMinutes: getRollingAverageMinutes(fairness, {
            memberId: member.user_id,
            window: '30d',
          }),
          preferenceScore: preferenceMaps.get(member.user_id)?.preferenceScore ?? 0,
          preferenceScoresByTemplate: preferenceMaps.get(member.user_id)?.preferenceScoresByTemplate,
          preferenceScoresByArea: preferenceMaps.get(member.user_id)?.preferenceScoresByArea,
        };
      }),
    };
  }, [
    activeHouseholdId,
    attendanceState.attendance,
    calendar.items,
    chores.completions,
    chores.energyEntries,
    chores.instances,
    chores.templates,
    members,
    preferenceMaps,
  ]);

  const suggestions = useMemo(() => scoreRotationSuggestions(context), [context]);

  const refreshSuggestions = useCallback(async (): Promise<RotationSuggestion[]> => {
    await Promise.all([
      chores.loadChores(),
      attendanceState.loadAttendance(),
      calendar.loadCalendar(),
      loadMembers(),
      loadPreferences(),
    ]);

    return rebalanceSuggestions(context);
  }, [attendanceState, calendar, chores, context, loadMembers, loadPreferences]);

  const applySuggestions = useCallback(async (
    nextSuggestions: Array<Pick<RotationSuggestion, 'choreInstanceId' | 'templateId' | 'recommendedMemberId' | 'rationale'>>
  ) => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    for (const suggestion of nextSuggestions) {
      const existingAssignments = chores.assignments.filter(
        (assignment) => assignment.instance_id === suggestion.choreInstanceId
      );

      if (existingAssignments.length > 0) {
        const ids = existingAssignments.map((assignment) => assignment.id);
        const { error: deleteError } = await supabase.from('chore_assignments').delete().in('id', ids);
        if (deleteError) {
          throw deleteError;
        }
      }

      if (suggestion.recommendedMemberId) {
        const instance = chores.instances.find((item) => item.id === suggestion.choreInstanceId);
        const { error: insertError } = await supabase.from('chore_assignments').insert({
          household_id: activeHouseholdId,
          template_id: suggestion.templateId,
          instance_id: suggestion.choreInstanceId,
          member_user_id: suggestion.recommendedMemberId,
          assigned_for: instance?.scheduled_for ?? null,
          assignment_status: 'assigned',
          assignment_reason: suggestion.rationale.join(' '),
          suggested_by: 'ai',
        });

        if (insertError) {
          throw insertError;
        }
      }
    }

    await Promise.all([chores.loadChores(), calendar.loadCalendar()]);
  }, [activeHouseholdId, calendar, chores]);

  return {
    suggestions,
    refreshSuggestions,
    applySuggestions,
    loading: chores.loading || attendanceState.loading || calendar.loading || preferencesLoading,
    error: chores.error || attendanceState.error || calendar.error || preferencesError,
  };
}
