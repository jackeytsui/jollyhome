import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

export interface ChoreFilterState {
  assigneeId: string;
  area: string;
  status: 'all' | 'open' | 'claimed' | 'completed' | 'bonus';
  urgency: 'all' | 'green' | 'yellow' | 'red';
}

interface FilterOption {
  label: string;
  value: string;
}

interface ChoreFiltersBarProps {
  filters: ChoreFilterState;
  assigneeOptions: FilterOption[];
  areaOptions: string[];
  onChange: (filters: ChoreFilterState) => void;
}

function FilterGroup({
  label,
  options,
  value,
  onSelect,
  testIdPrefix,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onSelect: (nextValue: string) => void;
  testIdPrefix: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((option) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              testID={`${testIdPrefix}-${option.value}`}
              onPress={() => onSelect(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ChoreFiltersBar({
  filters,
  assigneeOptions,
  areaOptions,
  onChange,
}: ChoreFiltersBarProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Filters</Text>

      <FilterGroup
        label="Assignee"
        testIdPrefix="filter-assignee"
        value={filters.assigneeId}
        options={[{ label: 'Everyone', value: 'all' }, ...assigneeOptions]}
        onSelect={(assigneeId) => onChange({ ...filters, assigneeId })}
      />

      <FilterGroup
        label="Area"
        testIdPrefix="filter-area"
        value={filters.area}
        options={[{ label: 'Everywhere', value: 'all' }, ...areaOptions.map((area) => ({ label: area, value: area }))]}
        onSelect={(area) => onChange({ ...filters, area })}
      />

      <FilterGroup
        label="Status"
        testIdPrefix="filter-status"
        value={filters.status}
        options={[
          { label: 'All', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'Claimed', value: 'claimed' },
          { label: 'Completed', value: 'completed' },
          { label: 'Bonus', value: 'bonus' },
        ]}
        onSelect={(status) => onChange({ ...filters, status: status as ChoreFilterState['status'] })}
      />

      <FilterGroup
        label="Urgency"
        testIdPrefix="filter-urgency"
        value={filters.urgency}
        options={[
          { label: 'Any', value: 'all' },
          { label: 'Green', value: 'green' },
          { label: 'Yellow', value: 'yellow' },
          { label: 'Red', value: 'red' },
        ]}
        onSelect={(urgency) => onChange({ ...filters, urgency: urgency as ChoreFilterState['urgency'] })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.textPrimary.light,
  },
  group: {
    gap: 6,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textSecondary.light,
  },
  chips: {
    gap: 8,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary.light,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
