import type { AttendanceStatus } from '@/types/calendar';

export interface RotationChoreInput {
  instanceId: string;
  templateId: string;
  title: string;
  area: string | null;
  estimatedMinutes: number;
}

export interface RotationMemberInput {
  id: string;
  name: string;
  active: boolean;
  availabilityScore: number;
  calendarConflictMinutes: number;
  attendanceStatus: AttendanceStatus | null;
  trailingTaskCount: number;
  trailingMinutes: number;
  learnedAverageMinutes: number | null;
  preferenceScore: number;
  queuePosition?: number;
}

export interface RotationContext {
  chores: RotationChoreInput[];
  members: RotationMemberInput[];
}

export interface RotationRanking {
  memberId: string;
  memberName: string;
  score: number;
  rationale: string[];
}

export interface RotationSuggestion {
  choreInstanceId: string;
  templateId: string;
  title: string;
  recommendedMemberId: string | null;
  estimatedEffortMinutes: number;
  rationale: string[];
  rankings: RotationRanking[];
}

interface RotationRationaleInput {
  memberName: string;
  availabilityScore: number;
  attendanceStatus: AttendanceStatus | null;
  trailingMinutes: number;
  trailingTaskCount: number;
  learnedAverageMinutes: number | null;
  estimatedEffortMinutes: number;
  preferenceScore: number;
  activeMemberCount: number;
  rosterChanged: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}

function getEstimatedEffortMinutes(
  chore: RotationChoreInput,
  members: RotationMemberInput[]
): number {
  const learned = members
    .map((member) => member.learnedAverageMinutes)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  if (learned.length === 0) {
    return chore.estimatedMinutes;
  }

  const averageLearned = learned.reduce((sum, value) => sum + value, 0) / learned.length;
  return Math.round(averageLearned);
}

function getLoadBaseline(members: RotationMemberInput[]) {
  if (members.length === 0) {
    return {
      averageMinutes: 0,
      averageTasks: 0,
    };
  }

  return {
    averageMinutes:
      members.reduce((sum, member) => sum + member.trailingMinutes, 0) / members.length,
    averageTasks:
      members.reduce((sum, member) => sum + member.trailingTaskCount, 0) / members.length,
  };
}

function computeMemberScore(
  member: RotationMemberInput,
  estimatedEffortMinutes: number,
  baseline: { averageMinutes: number; averageTasks: number },
  activeMemberCount: number
) {
  if (!member.active) {
    return Number.NEGATIVE_INFINITY;
  }

  const conflictPenalty = clamp(member.calendarConflictMinutes / 180, 0, 1);
  const attendancePenalty = member.attendanceStatus === 'away_tonight' ? 0.5 : 0;
  const availability = clamp(member.availabilityScore - conflictPenalty - attendancePenalty, 0, 1);
  const projectedMinutes = member.trailingMinutes + estimatedEffortMinutes;
  const loadDelta = projectedMinutes - baseline.averageMinutes;
  const taskDelta = member.trailingTaskCount - baseline.averageTasks;
  const loadRelief = clamp((-loadDelta / Math.max(estimatedEffortMinutes, 15)) * 0.05, -0.12, 0.12);
  const taskRelief = clamp((-taskDelta / Math.max(activeMemberCount, 1)) * 0.04, -0.08, 0.08);
  const preferenceWeight = clamp(member.preferenceScore * 0.2, -0.15, 0.15);

  return roundScore(availability * 1.05 + loadRelief + taskRelief + preferenceWeight);
}

export function buildRotationRationale(input: RotationRationaleInput): string[] {
  const reasons: string[] = [];

  if (input.availabilityScore >= 0.75 && input.attendanceStatus !== 'away_tonight') {
    reasons.push(`${input.memberName} has strong availability right now.`);
  } else if (input.attendanceStatus === 'away_tonight') {
    reasons.push(`${input.memberName} is marked away tonight, which lowers availability.`);
  } else {
    reasons.push(`${input.memberName}'s availability is limited by current timing.`);
  }

  if (input.trailingMinutes <= input.estimatedEffortMinutes) {
    reasons.push(`${input.memberName} has a lighter recent load.`);
  } else {
    reasons.push(`${input.memberName} already carries more recent load.`);
  }

  if (input.preferenceScore > 0.2) {
    reasons.push(`${input.memberName}'s preference fit nudges this chore upward.`);
  } else if (input.preferenceScore < -0.1) {
    reasons.push(`${input.memberName}'s preference fit nudges this chore downward.`);
  }

  if (input.learnedAverageMinutes && input.learnedAverageMinutes > 0) {
    reasons.push(`Learned duration suggests about ${input.estimatedEffortMinutes} minutes of effort.`);
  } else {
    reasons.push(`Estimated duration is about ${input.estimatedEffortMinutes} minutes.`);
  }

  if (input.rosterChanged || input.activeMemberCount > 2) {
    reasons.push(`Roster rebalancing keeps the active household fair.`);
  }

  return reasons;
}

export function scoreRotationSuggestions(context: RotationContext): RotationSuggestion[] {
  const activeMembers = context.members.filter((member) => member.active);
  const baseline = getLoadBaseline(activeMembers);
  const rosterChanged = activeMembers.length !== context.members.length || activeMembers.length > 2;

  return context.chores.map((chore) => {
    const estimatedEffortMinutes = getEstimatedEffortMinutes(chore, activeMembers);
    const rankings = activeMembers
      .map((member) => {
        const score = computeMemberScore(
          member,
          estimatedEffortMinutes,
          baseline,
          activeMembers.length
        );

        return {
          memberId: member.id,
          memberName: member.name,
          score,
          rationale: buildRotationRationale({
            memberName: member.name,
            availabilityScore: member.availabilityScore,
            attendanceStatus: member.attendanceStatus,
            trailingMinutes: member.trailingMinutes,
            trailingTaskCount: member.trailingTaskCount,
            learnedAverageMinutes: member.learnedAverageMinutes,
            estimatedEffortMinutes,
            preferenceScore: member.preferenceScore,
            activeMemberCount: activeMembers.length,
            rosterChanged,
          }),
        };
      })
      .sort((left, right) => right.score - left.score || left.memberName.localeCompare(right.memberName));

    return {
      choreInstanceId: chore.instanceId,
      templateId: chore.templateId,
      title: chore.title,
      recommendedMemberId: rankings[0]?.memberId ?? null,
      estimatedEffortMinutes,
      rationale: rankings[0]?.rationale ?? [],
      rankings,
    };
  });
}

export function rebalanceSuggestions(context: RotationContext): RotationSuggestion[] {
  return scoreRotationSuggestions(context);
}
