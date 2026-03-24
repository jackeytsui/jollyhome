import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { MealPlanEntry } from '@/types/meals';

interface MealPlanReviewSheetProps {
  visible: boolean;
  entry: MealPlanEntry | null;
  loading?: boolean;
  onClose: () => void;
  onGenerateShopping: (entry: MealPlanEntry) => Promise<void> | void;
  onMarkCooked: (entry: MealPlanEntry) => Promise<void> | void;
}

export function MealPlanReviewSheet({
  visible,
  entry,
  loading = false,
  onClose,
  onGenerateShopping,
  onMarkCooked,
}: MealPlanReviewSheetProps) {
  if (!visible || !entry) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{entry.title}</Text>
            <Text style={styles.caption}>
              {entry.plannedForDate} • {entry.slot} • {entry.servings} servings
            </Text>
            <Text style={styles.body}>
              Generate shopping list rows with pantry deduction, or mark the meal cooked to deduct recipe ingredients from pantry inventory.
            </Text>
            <Button
              label={loading ? 'Working...' : 'Generate shopping list'}
              loading={loading}
              onPress={() => onGenerateShopping(entry)}
            />
            <Button
              label={loading ? 'Working...' : 'Mark cooked'}
              variant="secondary"
              loading={loading}
              onPress={() => onMarkCooked(entry)}
            />
            <Button label="Close" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,22,18,0.38)' },
  sheet: { backgroundColor: colors.dominant.light, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary.light },
  caption: { color: colors.accent.light, fontWeight: '600' },
  body: { color: colors.textSecondary.light, lineHeight: 22 },
});
