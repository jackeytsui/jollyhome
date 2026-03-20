import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export const DIETARY_OPTIONS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'halal',
  'kosher',
  'keto',
  'paleo',
  'low-carb',
  'no-pork',
  'no-shellfish',
  'no-eggs',
  'lactose-intolerant',
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

const DIETARY_LABELS: Record<string, string> = {
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'pescatarian': 'Pescatarian',
  'gluten-free': 'Gluten-Free',
  'dairy-free': 'Dairy-Free',
  'nut-free': 'Nut-Free',
  'halal': 'Halal',
  'kosher': 'Kosher',
  'keto': 'Keto',
  'paleo': 'Paleo',
  'low-carb': 'Low-Carb',
  'no-pork': 'No Pork',
  'no-shellfish': 'No Shellfish',
  'no-eggs': 'No Eggs',
  'lactose-intolerant': 'Lactose-Intolerant',
};

interface DietaryTagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function DietaryTag({ label, selected = false, onPress }: DietaryTagProps) {
  const displayLabel = DIETARY_LABELS[label] ?? label;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tag,
        selected && styles.tagSelected,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {displayLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.secondary.light,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: colors.accent.light + '1A',
    borderColor: colors.accent.light,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  labelSelected: {
    color: colors.accent.light,
  },
});
