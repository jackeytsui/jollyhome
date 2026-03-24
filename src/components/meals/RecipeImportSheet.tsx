import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { RecipeImportDraft } from '@/types/recipes';

interface RecipeImportSheetProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onImported: (draft: RecipeImportDraft) => void;
}

export async function importRecipeFromUrl(sourceUrl: string): Promise<RecipeImportDraft> {
  const { data, error } = await supabase.functions.invoke('import-recipe', {
    body: { source_url: sourceUrl },
  });

  if (error) {
    throw error;
  }

  return data as RecipeImportDraft;
}

export function RecipeImportSheet({ visible, loading = false, onClose, onImported }: RecipeImportSheetProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [importing, setImporting] = useState(false);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Import recipe</Text>
            <Text style={styles.caption}>
              Paste a recipe URL. Structured schema.org data is preferred, but you will always review the draft before saving.
            </Text>
            <Input label="Recipe URL" value={sourceUrl} onChangeText={setSourceUrl} placeholder="https://example.com/recipe" autoCapitalize="none" />
            <View style={styles.actions}>
              <Button label="Cancel" variant="ghost" onPress={onClose} />
              <Button
                label={importing || loading ? 'Importing...' : 'Import'}
                loading={importing || loading}
                onPress={async () => {
                  setImporting(true);
                  try {
                    const draft = await importRecipeFromUrl(sourceUrl.trim());
                    onImported(draft);
                    setSourceUrl('');
                  } catch (err) {
                    Alert.alert('Unable to import recipe', err instanceof Error ? err.message : 'Please try again.');
                  } finally {
                    setImporting(false);
                  }
                }}
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
  sheet: { backgroundColor: colors.dominant.light, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary.light },
  caption: { lineHeight: 22, color: colors.textSecondary.light },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
