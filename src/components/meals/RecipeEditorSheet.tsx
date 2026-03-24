import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import type { Recipe, RecipeDifficulty, RecipeImportDraft } from '@/types/recipes';
import type { ShoppingCategoryKey } from '@/types/shopping';

export interface RecipeEditorValues {
  title: string;
  summary: string;
  imageUrl: string;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  tags: string[];
  favorite: boolean;
  source: 'manual' | 'url_import' | 'ai_import';
  sourceUrl: string | null;
  importedAt: string | null;
  notes: string;
  ingredients: Array<{
    title: string;
    quantity?: number | null;
    unit?: string | null;
    category?: ShoppingCategoryKey;
  }>;
}

export function draftToRecipeEditorValues(draft: RecipeImportDraft): RecipeEditorValues {
  return {
    title: draft.title,
    summary: draft.summary ?? '',
    imageUrl: draft.imageUrl ?? '',
    servings: draft.servings,
    prepMinutes: draft.prepMinutes,
    cookMinutes: draft.cookMinutes,
    totalMinutes: draft.totalMinutes,
    difficulty: null,
    tags: draft.tags,
    favorite: false,
    source: 'url_import',
    sourceUrl: draft.sourceUrl,
    importedAt: new Date().toISOString(),
    notes: draft.instructions.join('\n'),
    ingredients: draft.ingredients.map((ingredient) => ({
      title: ingredient.title,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category,
    })),
  };
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIngredients(value: string): RecipeEditorValues['ingredients'] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ title: line, category: 'other' as ShoppingCategoryKey }));
}

interface RecipeEditorSheetProps {
  visible: boolean;
  initialValues?: Partial<RecipeEditorValues> | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: RecipeEditorValues) => Promise<void> | void;
}

export function RecipeEditorSheet({
  visible,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: RecipeEditorSheetProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [summary, setSummary] = useState(initialValues?.summary ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [servings, setServings] = useState(initialValues?.servings ? String(initialValues.servings) : '');
  const [prepMinutes, setPrepMinutes] = useState(initialValues?.prepMinutes ? String(initialValues.prepMinutes) : '');
  const [cookMinutes, setCookMinutes] = useState(initialValues?.cookMinutes ? String(initialValues.cookMinutes) : '');
  const [totalMinutes, setTotalMinutes] = useState(initialValues?.totalMinutes ? String(initialValues.totalMinutes) : '');
  const [tags, setTags] = useState(initialValues?.tags?.join(', ') ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [ingredients, setIngredients] = useState(initialValues?.ingredients?.map((item) => item.title).join('\n') ?? '');

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setSummary(initialValues?.summary ?? '');
    setImageUrl(initialValues?.imageUrl ?? '');
    setServings(initialValues?.servings ? String(initialValues.servings) : '');
    setPrepMinutes(initialValues?.prepMinutes ? String(initialValues.prepMinutes) : '');
    setCookMinutes(initialValues?.cookMinutes ? String(initialValues.cookMinutes) : '');
    setTotalMinutes(initialValues?.totalMinutes ? String(initialValues.totalMinutes) : '');
    setTags(initialValues?.tags?.join(', ') ?? '');
    setNotes(initialValues?.notes ?? '');
    setIngredients(initialValues?.ingredients?.map((item) => item.title).join('\n') ?? '');
  }, [initialValues]);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{initialValues?.title ? 'Edit recipe' : 'New recipe'}</Text>
            <Input label="Recipe title" value={title} onChangeText={setTitle} placeholder="Sheet pan tacos" />
            <Input label="Summary" value={summary} onChangeText={setSummary} placeholder="Fast dinner for busy weeknights" />
            <Input label="Image URL" value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." autoCapitalize="none" />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Input label="Servings" value={servings} onChangeText={setServings} keyboardType="decimal-pad" placeholder="4" />
              </View>
              <View style={styles.flex}>
                <Input label="Prep mins" value={prepMinutes} onChangeText={setPrepMinutes} keyboardType="number-pad" placeholder="15" />
              </View>
              <View style={styles.flex}>
                <Input label="Cook mins" value={cookMinutes} onChangeText={setCookMinutes} keyboardType="number-pad" placeholder="20" />
              </View>
            </View>
            <Input label="Total mins" value={totalMinutes} onChangeText={setTotalMinutes} keyboardType="number-pad" placeholder="35" />
            <Input label="Tags" value={tags} onChangeText={setTags} placeholder="vegetarian, quick, batch" autoCapitalize="none" />
            <Input label="Ingredients" value={ingredients} onChangeText={setIngredients} placeholder={'1 onion\n2 tortillas\n1 can beans'} />
            <Input label="Instructions / notes" value={notes} onChangeText={setNotes} placeholder={'Roast vegetables\nWarm tortillas\nServe'} />

            <View style={styles.actions}>
              <Button label="Cancel" variant="ghost" onPress={onClose} />
              <Button
                label={loading ? 'Saving...' : 'Save recipe'}
                loading={loading}
                onPress={() =>
                  onSubmit({
                    title: title.trim(),
                    summary: summary.trim(),
                    imageUrl: imageUrl.trim(),
                    servings: servings ? Number(servings) : null,
                    prepMinutes: prepMinutes ? Number(prepMinutes) : null,
                    cookMinutes: cookMinutes ? Number(cookMinutes) : null,
                    totalMinutes: totalMinutes ? Number(totalMinutes) : null,
                    difficulty: initialValues?.difficulty ?? null,
                    tags: parseTags(tags),
                    favorite: initialValues?.favorite ?? false,
                    source: initialValues?.source ?? 'manual',
                    sourceUrl: initialValues?.sourceUrl ?? null,
                    importedAt: initialValues?.importedAt ?? null,
                    notes,
                    ingredients: parseIngredients(ingredients),
                  })
                }
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26, 22, 18, 0.38)' },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary.light },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
