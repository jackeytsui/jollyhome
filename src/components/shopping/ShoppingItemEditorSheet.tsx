import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import type { ShoppingCategoryKey, ShoppingListItem } from '@/types/shopping';

export interface ShoppingItemEditorValues {
  title: string;
  note: string;
  category: ShoppingCategoryKey;
  quantity: number | null;
  unit: string | null;
}

interface ShoppingItemEditorSheetProps {
  visible: boolean;
  initialValues?: Partial<ShoppingListItem> | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: ShoppingItemEditorValues) => Promise<void> | void;
}

const CATEGORIES: ShoppingCategoryKey[] = [
  'produce',
  'dairy',
  'meat_seafood',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'snacks',
  'household',
  'personal_care',
  'other',
];

export function ShoppingItemEditorSheet({
  visible,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: ShoppingItemEditorSheetProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [category, setCategory] = useState<ShoppingCategoryKey>(initialValues?.category ?? 'other');
  const [quantity, setQuantity] = useState(initialValues?.quantity ? String(initialValues.quantity) : '');
  const [unit, setUnit] = useState(initialValues?.unit ?? '');

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setNote(initialValues?.note ?? '');
    setCategory(initialValues?.category ?? 'other');
    setQuantity(initialValues?.quantity ? String(initialValues.quantity) : '');
    setUnit(initialValues?.unit ?? '');
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
            <Text style={styles.title}>{initialValues?.id ? 'Edit item' : 'Add item'}</Text>
            <Input value={title} onChangeText={setTitle} label="Item" placeholder="Add cilantro" />
            <Input value={note} onChangeText={setNote} label="Note" placeholder="For taco night" />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Input value={quantity} onChangeText={setQuantity} label="Quantity" keyboardType="decimal-pad" placeholder="1" />
              </View>
              <View style={styles.flex}>
                <Input value={unit} onChangeText={setUnit} label="Unit" placeholder="bottle" autoCapitalize="none" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryWrap}>
                {CATEGORIES.map((value) => {
                  const selected = value === category;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setCategory(value)}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                        {value.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.actions}>
              <Button label="Cancel" variant="ghost" onPress={onClose} />
              <Button
                label={loading ? 'Saving...' : 'Save item'}
                loading={loading}
                onPress={() =>
                  onSubmit({
                    title: title.trim(),
                    note: note.trim(),
                    category,
                    quantity: quantity ? Number(quantity) : null,
                    unit: unit.trim() || null,
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
    maxHeight: '88%',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.secondary.light,
  },
  categoryChipSelected: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  categoryLabel: {
    fontSize: 13,
    color: colors.textPrimary.light,
    textTransform: 'capitalize',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
