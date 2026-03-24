import type { ShoppingCategoryKey } from './shopping';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type RecipeSource = 'manual' | 'url_import' | 'ai_import';

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  title: string;
  note: string | null;
  quantity: number | null;
  unit: string | null;
  category: ShoppingCategoryKey;
  catalogItemId: string | null;
  optional: boolean;
  sortOrder: number;
}

export interface RecipeImportDraft {
  sourceUrl: string;
  sourceLabel: string | null;
  title: string;
  summary: string | null;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
}

export interface Recipe {
  id: string;
  householdId: string;
  title: string;
  summary: string | null;
  notes: string | null;
  source: RecipeSource;
  sourceUrl: string | null;
  imageUrl: string | null;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  tags: string[];
  favorite: boolean;
  importedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
