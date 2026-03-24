import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Pencil } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { ShoppingListItem } from '@/types/shopping';

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  onToggleChecked: (item: ShoppingListItem) => void;
  onEdit: (item: ShoppingListItem) => void;
}

export function ShoppingItemRow({ item, onToggleChecked, onEdit }: ShoppingItemRowProps) {
  const checked = Boolean(item.checkedOffAt);

  return (
    <Card style={checked ? styles.cardChecked : styles.card}>
      <Pressable style={styles.checkButton} onPress={() => onToggleChecked(item)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text style={[styles.title, checked && styles.titleChecked]}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.quantity ? `${item.quantity} ` : ''}
          {item.unit ?? ''}
          {item.minimumQuantity ? ` • min ${item.minimumQuantity}` : ''}
          {item.note ? ` • ${item.note}` : ''}
        </Text>
      </View>

      <Pressable onPress={() => onEdit(item)} style={styles.editButton}>
        <Pencil color={colors.textSecondary.light} size={16} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  cardChecked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    opacity: 0.72,
  },
  checkButton: {
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dominant.light,
  },
  checkboxChecked: {
    backgroundColor: colors.success.light,
    borderColor: colors.success.light,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  titleChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary.light,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary.light,
  },
  editButton: {
    padding: 4,
  },
});
