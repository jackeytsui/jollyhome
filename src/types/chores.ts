export type ChoreConditionState = 'green' | 'yellow' | 'red';
export type ChoreKind = 'responsibility' | 'bonus';
export type ChoreVisualWeight = 'light' | 'medium' | 'strong';
export type ChoreAssignmentStatus = 'suggested' | 'assigned' | 'accepted' | 'declined' | 'skipped';
export type ChoreInstanceStatus = 'open' | 'claimed' | 'completed' | 'skipped';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface ChoreTemplate {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  area: string | null;
  estimatedMinutes: number;
  recurrenceRule: string | null;
  recurrenceTimezone: string;
  recurrenceAnchor: string;
  nextOccurrenceAt: string | null;
  conditionState: ChoreConditionState;
  conditionScore: number;
  lastCompletedAt: string | null;
  kind: ChoreKind;
  createdBy: string;
  isArchived: boolean;
  iconKey: string | null;
  visualWeight: ChoreVisualWeight;
  createdAt: string;
  updatedAt: string;
}

export interface ChoreAssignment {
  id: string;
  householdId: string;
  templateId: string;
  memberId: string;
  assignedFor: string | null;
  assignmentStatus: ChoreAssignmentStatus;
  assignmentReason: string | null;
  memberColorKey: string | null;
  suggestedBy: 'ai' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface ChoreInstance {
  id: string;
  templateId: string;
  householdId: string;
  scheduledFor: string | null;
  dueWindowEnd: string | null;
  status: ChoreInstanceStatus;
  assignedMemberIds: string[];
  assignmentIds: string[];
  conditionState: ChoreConditionState;
  projectedFromRecurrence: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChoreCompletion {
  id: string;
  householdId: string;
  templateId: string;
  instanceId: string;
  completedBy: string;
  completedAt: string;
  actualMinutes: number | null;
  note: string | null;
  photoUrl: string | null;
  conditionStateAtCompletion: ChoreConditionState;
  createdAt: string;
}

export interface ChoreFairnessStats {
  householdId: string;
  memberId: string;
  completedTaskCount: number;
  completedMinutes: number;
  rolling14DayTaskCount: number;
  rolling14DayMinutes: number;
  rolling30DayTaskCount: number;
  rolling30DayMinutes: number;
  fairnessDelta: number;
  lastCompletedAt: string | null;
}

export interface MemberEnergyEntry {
  householdId: string;
  memberId: string;
  energyLevel: EnergyLevel;
  effectiveDate: string;
  note: string | null;
  createdAt: string;
}

export interface ChorePreference {
  householdId: string;
  memberId: string;
  templateId: string | null;
  area: string | null;
  preferenceScore: number;
  preferred: boolean;
  notes: string | null;
  updatedAt: string;
}
