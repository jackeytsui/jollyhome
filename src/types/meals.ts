export type MealPlanSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealPlanEntryStatus = 'planned' | 'cooked' | 'skipped';
export type MealServingSource = 'manual' | 'attendance' | 'recipe_default';
export type MealSuggestionAction = 'accept' | 'swap' | 'regenerate' | 'reject';
export type MealSuggestionRunStatus = 'pending' | 'completed' | 'failed';

export interface MealSuggestionRecommendation {
  pantryMatchCount: number;
  pantryFitScore: number;
  isFavorite: boolean;
  isManualDish: boolean;
  acceptedCount: number;
  cookedCount: number;
  lastUsedAt: string | null;
  daysSinceLastUsed: number | null;
  repeatCooldownActive: boolean;
  rotationReason: string | null;
  whyThisFits: string[];
}

export interface MealPlanEntry {
  id: string;
  householdId: string;
  recipeId: string | null;
  suggestionRunId: string | null;
  suggestionId: string | null;
  calendarItemId: string | null;
  title: string;
  slot: MealPlanSlot;
  plannedForDate: string;
  plannedForStartAt: string | null;
  plannedForEndAt: string | null;
  status: MealPlanEntryStatus;
  servings: number;
  servingSource: MealServingSource;
  attendanceMemberIds: string[];
  attendanceSnapshotDate: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealSuggestionRun {
  id: string;
  householdId: string;
  requestedBy: string;
  sourceDate: string;
  budgetCents: number | null;
  dietaryPreferences: string[];
  dietaryNotes: string | null;
  attendanceMemberIds: string[];
  attendanceSnapshotDate: string | null;
  status: MealSuggestionRunStatus;
  promptVersion: string | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface MealSuggestion {
  id: string;
  householdId: string;
  suggestionRunId: string;
  recipeId: string | null;
  title: string;
  slot: MealPlanSlot;
  plannedForDate: string;
  rationale: string | null;
  servings: number;
  attendanceMemberIds: string[];
  estimatedCostCents: number | null;
  tags: string[];
  rank: number;
  recommendation: MealSuggestionRecommendation | null;
}

export interface MealSuggestionFeedback {
  id: string;
  householdId: string;
  suggestionRunId: string;
  suggestionId: string | null;
  mealPlanEntryId: string | null;
  action: MealSuggestionAction;
  rating: 'positive' | 'negative' | 'neutral' | null;
  feedbackNote: string | null;
  replacementSuggestionId: string | null;
  recipeId: string | null;
  createdBy: string;
  createdAt: string;
}
