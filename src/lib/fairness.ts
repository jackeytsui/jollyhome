import { differenceInCalendarDays } from 'date-fns';
import type { ChoreFairnessStats } from '@/types/chores';

interface FairnessCompletion {
  householdId: string;
  templateId: string;
  completedBy: string;
  completedAt: string;
  actualMinutes: number | null;
}

interface BuildFairnessStatsInput {
  householdId: string;
  windowEnd: string;
  completions: FairnessCompletion[];
}

interface RollingAverageQuery {
  memberId: string;
  window: '14d' | '30d';
}

interface MemberLoadSummary {
  totalTasks: number;
  totalMinutes: number;
  averageFairnessDelta: number;
}

function minutesForCompletion(completion: FairnessCompletion): number {
  return completion.actualMinutes ?? 0;
}

export function buildFairnessStats(input: BuildFairnessStatsInput): ChoreFairnessStats[] {
  const relevant = input.completions.filter((completion) => completion.householdId === input.householdId);
  const grouped = new Map<string, FairnessCompletion[]>();

  for (const completion of relevant) {
    const existing = grouped.get(completion.completedBy) ?? [];
    existing.push(completion);
    grouped.set(completion.completedBy, existing);
  }

  const totalMinutes = relevant.reduce((sum, completion) => sum + minutesForCompletion(completion), 0);
  const averageMinutes = grouped.size > 0 ? totalMinutes / grouped.size : 0;

  return [...grouped.entries()]
    .map(([memberId, completions]) => {
      const completedMinutes = completions.reduce((sum, completion) => sum + minutesForCompletion(completion), 0);
      const rolling14 = completions.filter(
        (completion) => differenceInCalendarDays(new Date(input.windowEnd), new Date(completion.completedAt)) <= 14
      );
      const rolling30 = completions.filter(
        (completion) => differenceInCalendarDays(new Date(input.windowEnd), new Date(completion.completedAt)) <= 30
      );
      const lastCompletedAt = completions
        .map((completion) => completion.completedAt)
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

      return {
        householdId: input.householdId,
        memberId,
        completedTaskCount: completions.length,
        completedMinutes,
        rolling14DayTaskCount: rolling14.length,
        rolling14DayMinutes: rolling14.reduce((sum, completion) => sum + minutesForCompletion(completion), 0),
        rolling30DayTaskCount: rolling30.length,
        rolling30DayMinutes: rolling30.reduce((sum, completion) => sum + minutesForCompletion(completion), 0),
        fairnessDelta: completedMinutes - averageMinutes,
        lastCompletedAt,
      };
    })
    .sort((left, right) => left.memberId.localeCompare(right.memberId));
}

export function getRollingAverageMinutes(
  stats: ChoreFairnessStats[],
  query: RollingAverageQuery
): number {
  const stat = stats.find((candidate) => candidate.memberId === query.memberId);

  if (!stat) {
    return 0;
  }

  const taskCount = query.window === '14d' ? stat.rolling14DayTaskCount : stat.rolling30DayTaskCount;
  const minutes = query.window === '14d' ? stat.rolling14DayMinutes : stat.rolling30DayMinutes;

  return taskCount > 0 ? Math.round(minutes / taskCount) : 0;
}

export function summarizeMemberLoad(stats: ChoreFairnessStats[]): MemberLoadSummary {
  if (stats.length === 0) {
    return {
      totalTasks: 0,
      totalMinutes: 0,
      averageFairnessDelta: 0,
    };
  }

  const totalTasks = stats.reduce((sum, stat) => sum + stat.completedTaskCount, 0);
  const totalMinutes = stats.reduce((sum, stat) => sum + stat.completedMinutes, 0);
  const averageFairnessDelta =
    stats.reduce((sum, stat) => sum + stat.fairnessDelta, 0) / stats.length;

  return {
    totalTasks,
    totalMinutes,
    averageFairnessDelta,
  };
}
