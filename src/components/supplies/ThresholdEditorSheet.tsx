import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';

interface ThresholdEditorSheetProps {
  visible: boolean;
  title: string;
  unit: string;
  currentMinimumQuantity: number | null;
  currentPreferredReorderQuantity: number | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: { minimumQuantity: number | null; preferredReorderQuantity: number | null }) => Promise<void> | void;
}

export function ThresholdEditorSheet({
  visible,
  title,
  unit,
  currentMinimumQuantity,
  currentPreferredReorderQuantity,
  loading = false,
  onClose,
  onSubmit,
}: ThresholdEditorSheetProps) {
  const [minimumQuantity, setMinimumQuantity] = useState(currentMinimumQuantity ? String(currentMinimumQuantity) : '');
  const [preferredReorderQuantity, setPreferredReorderQuantity] = useState(
    currentPreferredReorderQuantity ? String(currentPreferredReorderQuantity) : ''
  );

  useEffect(() => {
    setMinimumQuantity(currentMinimumQuantity ? String(currentMinimumQuantity) : '');
    setPreferredReorderQuantity(currentPreferredReorderQuantity ? String(currentPreferredReorderQuantity) : '');
  }, [currentMinimumQuantity, currentPreferredReorderQuantity]);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Restock threshold</Text>
          <Text style={styles.caption}>{title} • {unit}</Text>
          <Input
            label="Minimum quantity"
            value={minimumQuantity}
            onChangeText={setMinimumQuantity}
            keyboardType="decimal-pad"
            placeholder="2"
          />
          <Input
            label="Preferred reorder quantity"
            value={preferredReorderQuantity}
            onChangeText={setPreferredReorderQuantity}
            keyboardType="decimal-pad"
            placeholder="4"
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="ghost" onPress={onClose} />
            <Button
              label={loading ? 'Saving...' : 'Save'}
              loading={loading}
              onPress={() =>
                onSubmit({
                  minimumQuantity: minimumQuantity ? Number(minimumQuantity) : null,
                  preferredReorderQuantity: preferredReorderQuantity ? Number(preferredReorderQuantity) : null,
                })
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 22, 18, 0.38)',
  },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary.light,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
