import type { ChoreConditionState, EnergyLevel } from '@/types/chores';

interface ConditionInput {
  lastCompletedAt: string | null;
  now: string;
  targetIntervalMinutes: number;
}

interface RankedChoreInput {
  id: string;
  title: string;
  estimatedMinutes: number;
  conditionState: ChoreConditionState;
  conditionScore: number;
}

interface RankedChore extends RankedChoreInput {
  rankingScore: number;
}

export interface ConditionProgress {
  elapsedMinutes: number;
  ratio: number;
  state: ChoreConditionState;
}

const CONDITION_WEIGHT: Record<ChoreConditionState, number> = {
  green: 0.45,
  yellow: 0.7,
  red: 1,
};

const ENERGY_EFFORT_WEIGHT: Record<EnergyLevel, number> = {
  low: 0.8,
  medium: 0.45,
  high: 0.2,
};

function getElapsedMinutes(lastCompletedAt: string | null, now: string): number {
  if (!lastCompletedAt) {
    return Number.MAX_SAFE_INTEGER;
  }

  const diffMs = new Date(now).getTime() - new Date(lastCompletedAt).getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

function getRawRatio(input: ConditionInput): number {
  if (input.targetIntervalMinutes <= 0) {
    return 1;
  }

  const elapsedMinutes = getElapsedMinutes(input.lastCompletedAt, input.now);
  if (elapsedMinutes === Number.MAX_SAFE_INTEGER) {
    return 2;
  }

  return elapsedMinutes / input.targetIntervalMinutes;
}

export function getConditionState(input: ConditionInput): ChoreConditionState {
  const ratio = getRawRatio(input);

  if (ratio >= 1.5) {
    return 'red';
  }

  if (ratio > 0.75) {
    return 'yellow';
  }

  return 'green';
}

export function getConditionProgress(input: ConditionInput): ConditionProgress {
  const elapsedMinutes = getElapsedMinutes(input.lastCompletedAt, input.now);

  return {
    elapsedMinutes,
    ratio: Math.min(1, getRawRatio(input)),
    state: getConditionState(input),
  };
}

export function rankChoresForEnergy(
  chores: RankedChoreInput[],
  energyLevel: EnergyLevel
): RankedChore[] {
  return [...chores]
    .map((chore) => ({
      ...chore,
      rankingScore:
        chore.conditionScore * 100 * CONDITION_WEIGHT[chore.conditionState] -
        chore.estimatedMinutes * ENERGY_EFFORT_WEIGHT[energyLevel],
    }))
    .sort((left, right) => right.rankingScore - left.rankingScore);
}
