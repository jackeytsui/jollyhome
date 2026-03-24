import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { buildMealPlannerInputs, serializeMealPlannerPayload } from '@/lib/mealPlanning';
import { AIMealPlanSheet } from '@/components/meals/AIMealPlanSheet';
import { MealBoard, type MealBoardItem } from '@/components/meals/MealBoard';
import { MealPlanReviewSheet } from '@/components/meals/MealPlanReviewSheet';
import { RecipeCard } from '@/components/meals/RecipeCard';
import { RecipeEditorSheet, type RecipeEditorValues, draftToRecipeEditorValues } from '@/components/meals/RecipeEditorSheet';
import { RecipeImportSheet } from '@/components/meals/RecipeImportSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { useAttendance } from '@/hooks/useAttendance';
import { buildMealWeekRange, deriveMealServings, useMealPlans } from '@/hooks/useMealPlans';
import { useMembers } from '@/hooks/useMembers';
import { useRecipes } from '@/hooks/useRecipes';
import { useHouseholdStore } from '@/stores/household';
import type { MealPlanEntry, MealPlanSlot } from '@/types/meals';
import type { Recipe } from '@/types/recipes';

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function buildWeekDates(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function mapRecipeToEditorValues(recipe: Recipe, ingredientTitles: string[]): RecipeEditorValues {
  return {
    title: recipe.title,
    summary: recipe.summary ?? '',
    imageUrl: recipe.imageUrl ?? '',
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    totalMinutes: recipe.totalMinutes,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    favorite: recipe.favorite,
    source: recipe.source,
    sourceUrl: recipe.sourceUrl,
    importedAt: recipe.importedAt,
    notes: recipe.notes ?? '',
    ingredients: ingredientTitles.map((title) => ({ title, category: 'other' })),
  };
}

export default function MealsScreen() {
  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const { attendance } = useAttendance();
  const { members, loadMembers } = useMembers(activeHouseholdId);
  const {
    recipes,
    ingredientsByRecipeId,
    importDraft,
    loading: recipesLoading,
    createRecipe,
    updateRecipe,
    toggleFavorite,
    saveImportDraft,
    clearImportDraft,
  } = useRecipes();
  const {
    weekStart,
    mealPlans,
    loading: mealsLoading,
    generatedShoppingItems,
    setWeekStart,
    saveMealPlanEntry,
    generateShoppingList,
    markMealCooked,
    submitSuggestionFeedback,
    suggestions,
  } = useMealPlans();

  const [editorVisible, setEditorVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealBoardItem | null>(null);
  const [reviewEntry, setReviewEntry] = useState<MealPlanEntry | null>(null);
  const [aiSheetVisible, setAISheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeHouseholdId) {
      loadMembers();
    }
  }, [activeHouseholdId, loadMembers]);

  const weekDates = useMemo(() => buildWeekDates(weekStart), [weekStart]);
  const attendanceByDate = useMemo(
    () =>
      attendance.reduce<Record<string, string[]>>((accumulator, row) => {
        if (row.status === 'home_tonight') {
          const current = accumulator[row.attendance_date] ?? [];
          accumulator[row.attendance_date] = [...current, row.member_user_id];
        }
        return accumulator;
      }, {}),
    [attendance]
  );

  const dietaryNotes = useMemo(
    () => [...new Set(members.flatMap((member) => member.profile.dietary_preferences))],
    [members]
  );

  const plannerPayload = useMemo(
    () =>
      serializeMealPlannerPayload(
        buildMealPlannerInputs({
          startDate: weekStart,
          members: members.map((member) => ({
            userId: member.user_id,
            dietaryPreferences: member.profile.dietary_preferences,
          })),
          attendanceByDate,
          calendarLoadByDate: Object.fromEntries(weekDates.map((date) => [date, 45])),
          pantryItems: [],
          recipes: recipes.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            prepMinutes: recipe.prepMinutes,
            cookMinutes: recipe.cookMinutes,
            totalMinutes: recipe.totalMinutes,
            tags: recipe.tags,
            ingredients: (ingredientsByRecipeId[recipe.id] ?? []).map((ingredient) => ({
              catalogItemId: ingredient.catalogItemId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
            })),
          })),
        })
      ),
    [attendanceByDate, ingredientsByRecipeId, members, recipes, weekDates, weekStart]
  );

  async function handleRecipeSubmit(values: RecipeEditorValues) {
    setSaving(true);
    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, values);
      } else {
        await createRecipe(values);
      }
      setEditorVisible(false);
      setEditingRecipe(null);
      clearImportDraft();
    } catch (err) {
      Alert.alert('Unable to save recipe', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function assignRecipeToSlot(recipe: Recipe, date: string, slot: MealPlanSlot) {
    const attendanceMemberIds = attendanceByDate[date] ?? [];
    const derived = deriveMealServings({
      attendanceMemberIds,
      recipeServings: recipe.servings,
    });

    await saveMealPlanEntry({
      title: recipe.title,
      recipeId: recipe.id,
      slot,
      plannedForDate: date,
      servings: derived.servings,
      servingSource: derived.servingSource,
      attendanceMemberIds,
      attendanceSnapshotDate: date,
      notes: recipe.notes ?? null,
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Phase 04</Text>
          <Text style={styles.title}>Meals</Text>
          <Text style={styles.subtitle}>
            Recipes, weekly planning, attendance-based servings, pantry-aware shopping generation, and cooked-meal inventory sync.
          </Text>
        </View>

        <Card style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Week of {weekStart}</Text>
              <Text style={styles.heroMeta}>
                {dietaryNotes.length > 0 ? dietaryNotes.join(', ') : 'No household dietary tags yet'}
              </Text>
            </View>
            <View style={styles.heroActions}>
              <Button label="Prev week" variant="ghost" onPress={() => setWeekStart(addDays(weekStart, -7))} />
              <Button label="Next week" variant="ghost" onPress={() => setWeekStart(addDays(weekStart, 7))} />
            </View>
          </View>
          {generatedShoppingItems.length > 0 ? (
            <Text style={styles.generated}>Last shopping generation created {generatedShoppingItems.length} row(s).</Text>
          ) : null}
          <Button
            label="AI plan week"
            onPress={async () => {
              setSaving(true);
              try {
                await supabase.functions.invoke('generate-meal-plan', {
                  body: {
                    household_id: activeHouseholdId,
                    planner_payload: plannerPayload,
                    accepted_ids: suggestions.map((suggestion) => suggestion.id),
                  },
                });
                setAISheetVisible(true);
              } catch (err) {
                Alert.alert('Unable to generate meal plan', err instanceof Error ? err.message : 'Please try again.');
              } finally {
                setSaving(false);
              }
            }}
          />
        </Card>

        <MealBoard
          weekDates={weekDates}
          entries={mealPlans}
          attendanceByDate={attendanceByDate}
          onSelectSlot={(item) => {
            setSelectedSlot(item);
            if (selectedRecipe) {
              void assignRecipeToSlot(selectedRecipe, item.date, item.slot);
            }
          }}
          onReorder={async (items) => {
            const moved = items.find((item, index) => {
              const expected = buildWeekDates(weekStart).flatMap((date) =>
                (['breakfast', 'lunch', 'dinner', 'snack'] as MealPlanSlot[]).map((slot) => `${date}:${slot}`)
              )[index];
              return item.entry && item.key !== expected;
            });

            if (!moved?.entry) {
              return;
            }

            try {
              await saveMealPlanEntry({
                id: moved.entry.id,
                title: moved.entry.title,
                recipeId: moved.entry.recipeId,
                slot: moved.slot,
                plannedForDate: moved.date,
                servings: moved.entry.servings,
                servingSource: moved.entry.servingSource,
                attendanceMemberIds: attendanceByDate[moved.date] ?? moved.entry.attendanceMemberIds,
                attendanceSnapshotDate: moved.date,
                notes: moved.entry.notes,
              });
            } catch (err) {
              Alert.alert('Unable to move meal', err instanceof Error ? err.message : 'Please try again.');
            }
          }}
        />

        <Card style={styles.library}>
          <View style={styles.libraryHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recipe library</Text>
              <Text style={styles.sectionMeta}>{recipes.length} recipes • {recipes.filter((recipe) => recipe.favorite).length} favorites</Text>
            </View>
            <View style={styles.libraryActions}>
              <Button label="Import" variant="secondary" onPress={() => setImportVisible(true)} />
              <Button
                label="New recipe"
                onPress={() => {
                  setEditingRecipe(null);
                  setEditorVisible(true);
                }}
              />
            </View>
          </View>
          {recipesLoading || mealsLoading ? <Text style={styles.status}>Loading meal planning data…</Text> : null}
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onToggleFavorite={(value) => void toggleFavorite(value.id, !value.favorite)}
              onEdit={(value) => {
                setEditingRecipe(value);
                setEditorVisible(true);
              }}
              onUse={(value) => {
                setSelectedRecipe(value);
                const firstOpenDate = weekDates[0];
                void assignRecipeToSlot(value, firstOpenDate, 'dinner');
              }}
            />
          ))}
        </Card>

        <Card style={styles.reviewPrompt}>
          <Text style={styles.sectionTitle}>Meal actions</Text>
          <Text style={styles.sectionMeta}>Open a planned meal to generate shopping needs or mark it cooked.</Text>
          <View style={styles.reviewActions}>
            {mealPlans.slice(0, 3).map((entry) => (
              <Button key={entry.id} label={entry.title} variant="secondary" onPress={() => setReviewEntry(entry)} />
            ))}
          </View>
        </Card>
      </ScrollView>

      <RecipeEditorSheet
        visible={editorVisible || Boolean(importDraft)}
        initialValues={
          importDraft
            ? draftToRecipeEditorValues(importDraft)
            : editingRecipe
              ? mapRecipeToEditorValues(editingRecipe, (ingredientsByRecipeId[editingRecipe.id] ?? []).map((item) => item.title))
              : null
        }
        loading={saving}
        onClose={() => {
          setEditorVisible(false);
          setEditingRecipe(null);
          clearImportDraft();
        }}
        onSubmit={handleRecipeSubmit}
      />

      <RecipeImportSheet
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImported={(draft) => {
          saveImportDraft(draft);
          setImportVisible(false);
          setEditorVisible(true);
        }}
      />

      <MealPlanReviewSheet
        visible={Boolean(reviewEntry)}
        entry={reviewEntry}
        loading={saving}
        onClose={() => setReviewEntry(null)}
        onGenerateShopping={async (entry) => {
          setSaving(true);
          try {
            await generateShoppingList({ mealPlanEntryIds: [entry.id], weekStart: buildMealWeekRange(weekStart).weekStart });
            setReviewEntry(null);
          } catch (err) {
            Alert.alert('Unable to generate shopping list', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
        onMarkCooked={async (entry) => {
          setSaving(true);
          try {
            await markMealCooked(entry.id);
            setReviewEntry(null);
          } catch (err) {
            Alert.alert('Unable to mark meal cooked', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <AIMealPlanSheet
        visible={aiSheetVisible}
        suggestions={suggestions}
        loading={saving}
        onClose={() => setAISheetVisible(false)}
        onAccept={async (suggestion) => {
          setSaving(true);
          try {
            await saveMealPlanEntry({
              title: suggestion.title,
              recipeId: suggestion.recipeId,
              suggestionRunId: suggestion.suggestionRunId,
              suggestionId: suggestion.id,
              slot: suggestion.slot,
              plannedForDate: suggestion.plannedForDate,
              servings: suggestion.servings,
              servingSource: 'attendance',
              attendanceMemberIds: suggestion.attendanceMemberIds,
              attendanceSnapshotDate: suggestion.plannedForDate,
            });
            await submitSuggestionFeedback({
              suggestionRunId: suggestion.suggestionRunId,
              suggestionId: suggestion.id,
              action: 'accept',
              recipeId: suggestion.recipeId,
            });
          } finally {
            setSaving(false);
          }
        }}
        onSwap={async (suggestion) => {
          setSaving(true);
          try {
            await submitSuggestionFeedback({
              suggestionRunId: suggestion.suggestionRunId,
              suggestionId: suggestion.id,
              action: 'swap',
              recipeId: suggestion.recipeId,
            });
          } finally {
            setSaving(false);
          }
        }}
        onRegenerate={async (suggestion) => {
          setSaving(true);
          try {
            await submitSuggestionFeedback({
              suggestionRunId: suggestion.suggestionRunId,
              suggestionId: suggestion.id,
              action: 'regenerate',
              recipeId: suggestion.recipeId,
              feedbackNote: 'User requested a new option',
            });
            await supabase.functions.invoke('generate-meal-plan', {
              body: {
                household_id: activeHouseholdId,
                planner_payload: plannerPayload,
                accepted_ids: suggestions.map((item) => item.id),
                regenerate_slot: {
                  plannedForDate: suggestion.plannedForDate,
                  slot: suggestion.slot,
                },
              },
            });
          } finally {
            setSaving(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dominant.light },
  screen: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { gap: 6 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, fontWeight: '700', color: colors.accent.light },
  title: { fontSize: 30, fontWeight: '800', color: colors.textPrimary.light },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary.light },
  hero: { gap: 10 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary.light },
  heroMeta: { color: colors.textSecondary.light },
  heroActions: { gap: 8 },
  generated: { color: colors.success.light, fontWeight: '600' },
  library: { gap: 12 },
  libraryHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  libraryActions: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary.light },
  sectionMeta: { color: colors.textSecondary.light, lineHeight: 20 },
  status: { color: colors.textSecondary.light },
  reviewPrompt: { gap: 12 },
  reviewActions: { gap: 8 },
});
