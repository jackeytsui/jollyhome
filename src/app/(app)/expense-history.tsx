import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/constants/theme';
import { useExpenses } from '@/hooks/useExpenses';
import { useBalances } from '@/hooks/useBalances';
import { useMembers } from '@/hooks/useMembers';
import { useExpenseStore } from '@/stores/expenses';
import { useHouseholdStore } from '@/stores/household';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { FilterBar } from '@/components/expenses/FilterBar';
import { ExpenseDetailSheet } from '@/components/expenses/ExpenseDetailSheet';
import type { ExpenseWithSplits } from '@/hooks/useExpenses';
import type { ExpenseFilters } from '@/types/expenses';

const PAGE_SIZE = 20;

export default function ExpenseHistoryScreen() {
  const { activeHouseholdId } = useHouseholdStore();
  const { loadFilteredExpenses, loadExpenses } = useExpenses();
  const { loadBalances } = useBalances();
  const { members } = useMembers(activeHouseholdId);
  const { activeFilters, setFilters, clearFilters } = useExpenseStore();

  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithSplits | null>(null);

  // Track the current filter snapshot to detect changes
  const filtersRef = useRef<ExpenseFilters>(activeFilters);

  const fetchPage = useCallback(
    async (filters: ExpenseFilters, pageNum: number, replace: boolean) => {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await loadFilteredExpenses(filters, pageNum);
        if (replace) {
          setExpenses(data);
        } else {
          setExpenses((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === PAGE_SIZE);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadFilteredExpenses]
  );

  // Load initial data and on filter changes
  useEffect(() => {
    filtersRef.current = activeFilters;
    setPage(0);
    fetchPage(activeFilters, 0, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters]);

  const handleEndReached = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(filtersRef.current, nextPage, false);
  }, [loadingMore, hasMore, loading, page, fetchPage]);

  const handleFilterChange = useCallback(
    (partial: Partial<ExpenseFilters>) => {
      setFilters(partial);
    },
    [setFilters]
  );

  const handleClear = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const renderItem = useCallback(
    ({ item }: { item: ExpenseWithSplits }) => (
      <ExpenseCard
        expense={item}
        onPress={() => setSelectedExpense(item)}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: ExpenseWithSplits) => item.id, []);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyHeading}>No expenses match your filters</Text>
        <Pressable style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </Pressable>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.accent.light} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Expense History</Text>
      </View>

      {/* FilterBar (sticky) */}
      <View style={styles.filterContainer}>
        <FilterBar
          filters={activeFilters}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          members={members}
        />
      </View>

      {/* FlatList of expenses */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.light} size="large" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Expense Detail Sheet */}
      <ExpenseDetailSheet
        visible={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onUpdate={() => {
          setSelectedExpense(null);
          loadExpenses();
          loadBalances();
          fetchPage(filtersRef.current, 0, true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  filterContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.dominant.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 64,
    flexGrow: 1,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    gap: 16,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 24,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
