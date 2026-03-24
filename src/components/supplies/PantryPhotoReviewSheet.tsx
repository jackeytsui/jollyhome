import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { StagedPantryPhotoItem } from '@/lib/foodNormalization';

interface PantryPhotoReviewSheetProps {
  visible: boolean;
  items: StagedPantryPhotoItem[];
  loading?: boolean;
  onClose: () => void;
  onAcceptItem: (item: StagedPantryPhotoItem) => Promise<void> | void;
}

export function PantryPhotoReviewSheet({
  visible,
  items,
  loading = false,
  onClose,
  onAcceptItem,
}: PantryPhotoReviewSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Pantry photo review</Text>
            <Text style={styles.caption}>
              AI suggestions stay draft-only until you confirm them.
            </Text>
            {loading ? <Text style={styles.loading}>Applying review items…</Text> : null}
            {items.map((item) => (
              <View key={`${item.rawLabel}-${item.confidence}`} style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.itemTitle}>{item.displayName}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity ?? 1} {item.unit} • {Math.round(item.confidence * 100)}% confidence • {item.status}
                  </Text>
                </View>
                <Button label="Accept" size="sm" onPress={() => onAcceptItem(item)} />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,22,18,0.38)' },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary.light },
  caption: { color: colors.textSecondary.light, lineHeight: 22 },
  loading: { color: colors.accent.light, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 16,
    backgroundColor: colors.secondary.light,
    padding: 14,
  },
  copy: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary.light },
  itemMeta: { color: colors.textSecondary.light, lineHeight: 20 },
});
