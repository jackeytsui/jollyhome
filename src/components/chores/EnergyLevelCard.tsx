import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { EnergyLevel } from '@/types/chores';

interface EnergyLevelCardProps {
  value: EnergyLevel;
  loading?: boolean;
  onChange: (value: EnergyLevel) => void;
}

const OPTIONS: EnergyLevel[] = ['low', 'medium', 'high'];

export function EnergyLevelCard({ value, loading = false, onChange }: EnergyLevelCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Energy level</Text>
        <Text style={styles.subtitle}>
          Pick today&apos;s pace so your personal list leans toward lighter or heavier work.
        </Text>
      </View>

      <View style={styles.row}>
        {OPTIONS.map((option) => (
          <View key={option} style={styles.optionWrap}>
            <Button
              label={option}
              variant={value === option ? 'primary' : 'secondary'}
              disabled={loading && value !== option}
              loading={loading && value === option}
              onPress={() => onChange(option)}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  optionWrap: {
    flex: 1,
  },
});
