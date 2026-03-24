import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow';
import { colors } from '@/constants/theme';
import type { ShoppingCategoryKey, ShoppingListItem } from '@/types/shopping';

interface AisleGroupSectionProps {
  category: ShoppingCategoryKey;
  items: ShoppingListItem[];
  onToggleChecked: (item: ShoppingListItem) => void;
  onEdit: (item: ShoppingListItem) => void;
}

const CATEGORY_LABELS: Record<ShoppingCategoryKey, string> = {
  produce: 'Produce',
  dairy: 'Dairy',
  meat_seafood: 'Meat & seafood',
  bakery: 'Bakery',
  frozen: 'Frozen',
  pantry: 'Pantry',
  beverages: 'Beverages',
  snacks: 'Snacks',
  household: 'Household',
  personal_care: 'Personal care',
  other: 'Other',
};

export function AisleGroupSection({ category, items, onToggleChecked, onEdit }: AisleGroupSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{CATEGORY_LABELS[category]}</Text>
      <View style={styles.items}>
        {items.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggleChecked={onToggleChecked}
            onEdit={onEdit}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary.light,
  },
  items: {
    gap: 10,
  },
});
