import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors } from '@/constants/theme';
import type { ExpenseFilters } from '@/types/expenses';
import type { Member } from '@/hooks/useMembers';

const CATEGORIES = [
  'Groceries', 'Utilities', 'Rent', 'Dining', 'Transport',
  'Entertainment', 'Health', 'Shopping', 'Travel', 'Other',
];

interface FilterBarProps {
  filters: ExpenseFilters;
  onFilterChange: (filters: Partial<ExpenseFilters>) => void;
  onClear: () => void;
  members: Member[];
}

type ActivePanel = 'date' | 'category' | 'member' | 'amount' | 'search' | null;

export function FilterBar({ filters, onFilterChange, onClear, members }: FilterBarProps) {
  const [openPanel, setOpenPanel] = useState<ActivePanel>(null);

  const hasAnyFilter =
    filters.dateFrom != null ||
    filters.dateTo != null ||
    filters.category != null ||
    filters.memberId != null ||
    filters.amountMin != null ||
    filters.amountMax != null ||
    filters.search != null;

  function togglePanel(panel: ActivePanel) {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }

  const isActive = (panel: ActivePanel) => {
    switch (panel) {
      case 'date':
        return filters.dateFrom != null || filters.dateTo != null;
      case 'category':
        return filters.category != null;
      case 'member':
        return filters.memberId != null;
      case 'amount':
        return filters.amountMin != null || filters.amountMax != null;
      case 'search':
        return filters.search != null;
      default:
        return false;
    }
  };

  function chipStyle(panel: ActivePanel) {
    return isActive(panel)
      ? [styles.chip, styles.chipActive]
      : [styles.chip, styles.chipInactive];
  }

  function chipTextStyle(panel: ActivePanel) {
    return isActive(panel)
      ? [styles.chipText, styles.chipTextActive]
      : [styles.chipText, styles.chipTextInactive];
  }

  return (
    <View style={styles.container}>
      {/* Chip row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable style={chipStyle('date')} onPress={() => togglePanel('date')}>
          <Text style={chipTextStyle('date')}>Date</Text>
        </Pressable>

        <Pressable style={chipStyle('category')} onPress={() => togglePanel('category')}>
          <Text style={chipTextStyle('category')}>Category</Text>
        </Pressable>

        <Pressable style={chipStyle('member')} onPress={() => togglePanel('member')}>
          <Text style={chipTextStyle('member')}>Member</Text>
        </Pressable>

        <Pressable style={chipStyle('amount')} onPress={() => togglePanel('amount')}>
          <Text style={chipTextStyle('amount')}>Amount</Text>
        </Pressable>

        <Pressable style={chipStyle('search')} onPress={() => togglePanel('search')}>
          <Text style={chipTextStyle('search')}>Search</Text>
        </Pressable>

        {hasAnyFilter && (
          <Pressable
            style={[styles.chip, styles.clearChip]}
            onPress={() => { onClear(); setOpenPanel(null); }}
          >
            <Text style={styles.clearChipText}>Clear</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Date panel */}
      {openPanel === 'date' && (
        <View style={styles.panel}>
          <View style={styles.panelRow}>
            <View style={styles.panelField}>
              <Text style={styles.panelLabel}>From</Text>
              <TextInput
                style={styles.panelInput}
                value={filters.dateFrom ?? ''}
                onChangeText={(v) => onFilterChange({ dateFrom: v || null })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary.light}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.panelField}>
              <Text style={styles.panelLabel}>To</Text>
              <TextInput
                style={styles.panelInput}
                value={filters.dateTo ?? ''}
                onChangeText={(v) => onFilterChange({ dateTo: v || null })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary.light}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>
      )}

      {/* Category panel */}
      {openPanel === 'category' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.panel}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                filters.category === cat ? styles.chipActive : styles.chipInactive,
              ]}
              onPress={() => onFilterChange({ category: filters.category === cat ? null : cat })}
            >
              <Text
                style={[
                  styles.chipText,
                  filters.category === cat ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Member panel */}
      {openPanel === 'member' && (
        <View style={styles.panel}>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {members.map((m) => {
                const name = m.profile.display_name ?? m.user_id.slice(0, 8);
                const isSelected = filters.memberId === m.user_id;
                return (
                  <Pressable
                    key={m.user_id}
                    style={[styles.chip, isSelected ? styles.chipActive : styles.chipInactive]}
                    onPress={() => onFilterChange({ memberId: isSelected ? null : m.user_id })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Amount panel */}
      {openPanel === 'amount' && (
        <View style={styles.panel}>
          <View style={styles.panelRow}>
            <View style={styles.panelField}>
              <Text style={styles.panelLabel}>Min ($)</Text>
              <TextInput
                style={styles.panelInput}
                value={filters.amountMin != null ? String(filters.amountMin) : ''}
                onChangeText={(v) => onFilterChange({ amountMin: v ? parseFloat(v) : null })}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary.light}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.panelField}>
              <Text style={styles.panelLabel}>Max ($)</Text>
              <TextInput
                style={styles.panelInput}
                value={filters.amountMax != null ? String(filters.amountMax) : ''}
                onChangeText={(v) => onFilterChange({ amountMax: v ? parseFloat(v) : null })}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary.light}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      )}

      {/* Search panel */}
      {openPanel === 'search' && (
        <View style={styles.panel}>
          <TextInput
            style={[styles.panelInput, styles.searchInput]}
            value={filters.search ?? ''}
            onChangeText={(v) => onFilterChange({ search: v || null })}
            placeholder="Search expenses..."
            placeholderTextColor={colors.textSecondary.light}
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chip: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.accent.light,
  },
  chipInactive: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: colors.textPrimary.light,
  },
  clearChip: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.destructive.light,
  },
  clearChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.destructive.light,
  },
  panel: {
    marginHorizontal: 16,
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  panelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  panelField: {
    flex: 1,
    gap: 4,
  },
  panelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  panelInput: {
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary.light,
    minHeight: 44,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    textAlign: 'center',
  },
});
