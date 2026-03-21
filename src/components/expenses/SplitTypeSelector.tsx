import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import type { SplitType, SplitPreset } from '@/types/expenses';

interface SplitTypeSelectorProps {
  selected: SplitType;
  presets: SplitPreset[];
  onSelect: (type: SplitType, presetId?: string) => void;
}

interface ChipOption {
  label: string;
  type: SplitType;
  presetId?: string;
}

export function SplitTypeSelector({ selected, presets, onSelect }: SplitTypeSelectorProps) {
  const baseOptions: ChipOption[] = [
    { label: 'Equal', type: 'equal' },
    { label: 'Percentages', type: 'percentage' },
    { label: 'Exact', type: 'exact' },
    { label: 'Shares', type: 'shares' },
  ];

  const presetOptions: ChipOption[] = presets.map((p) => ({
    label: p.name,
    type: 'preset',
    presetId: p.id,
  }));

  const allOptions = [...baseOptions, ...presetOptions];

  function handlePress(option: ChipOption) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(option.type, option.presetId);
  }

  function isActive(option: ChipOption): boolean {
    return option.type === selected && (option.type !== 'preset' || true);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {allOptions.map((option) => {
        const active = isActive(option);
        return (
          <Pressable
            key={`${option.type}-${option.presetId ?? 'base'}-${option.label}`}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => handlePress(option)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
