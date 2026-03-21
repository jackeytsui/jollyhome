import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useExpenses } from '@/hooks/useExpenses';
import { useBalances } from '@/hooks/useBalances';
import { useMembers } from '@/hooks/useMembers';
import { useHouseholdStore } from '@/stores/household';
import { useAuthStore } from '@/stores/auth';
import { BalanceSummaryCard } from '@/components/expenses/BalanceSummaryCard';
import { QuickAddCard } from '@/components/expenses/QuickAddCard';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseSkeletonCard } from '@/components/expenses/ExpenseSkeletonCard';
import { OfflineBanner } from '@/components/expenses/OfflineBanner';
import { DebtDetailSheet } from '@/components/expenses/DebtDetailSheet';
import { ExpenseDetailSheet } from '@/components/expenses/ExpenseDetailSheet';
import type { CreateExpenseInput } from '@/types/expenses';
import type { ExpenseWithSplits } from '@/hooks/useExpenses';

export default function FinancesScreen() {
  const router = useRouter();
  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();

  const { expenses, loading: expensesLoading, createExpense, loadExpenses, presets } = useExpenses();
  const {
    netBalances,
    simplifiedDebts,
    loading: balancesLoading,
    loadBalances,
  } = useBalances();
  const { members, loadMembers } = useMembers(activeHouseholdId);

  const [isOffline, setIsOffline] = useState(false);
  const [selectedDebtMember, setSelectedDebtMember] = useState<{ userId: string; name: string } | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithSplits | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ['85%'];

  // Load all data on mount
  useEffect(() => {
    loadExpenses();
    loadBalances();
    if (activeHouseholdId) {
      loadMembers();
    }
  }, [activeHouseholdId, loadExpenses, loadBalances, loadMembers]);

  const handleOpenAddExpense = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleScanReceipt = useCallback(() => {
    Alert.alert('Coming soon', 'Receipt scanning is coming in a future update.');
  }, []);

  const handleSaveExpense = useCallback(
    async (input: CreateExpenseInput) => {
      try {
        await createExpense(input);
        bottomSheetRef.current?.close();
        loadExpenses();
        loadBalances();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save expense';
        if (
          message.toLowerCase().includes('network') ||
          message.toLowerCase().includes('offline') ||
          message.toLowerCase().includes('fetch')
        ) {
          setIsOffline(true);
          bottomSheetRef.current?.close();
        } else {
          Alert.alert('Error', message);
        }
      }
    },
    [createExpense, loadExpenses, loadBalances]
  );

  const handleMemberPress = useCallback((userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    setSelectedDebtMember({ userId, name: member?.profile.display_name ?? 'Member' });
  }, [members]);

  const handleExpensePress = useCallback((expense: ExpenseWithSplits) => {
    setSelectedExpense(expense);
  }, []);

  const hasHousehold = Boolean(activeHouseholdId);
  const showSkeleton = expensesLoading && expenses.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {isOffline && <OfflineBanner />}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isOffline && styles.scrollContentOffline]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Jolly NL Input — placeholder, functional in Plan 07 */}
        <TextInput
          style={styles.jollyInput}
          placeholder={'Tell Jolly... (e.g., "Pizza with Jake, $42")'}
          placeholderTextColor={colors.textSecondary.light}
          editable={false}
          pointerEvents="none"
        />

        {/* Balance Summary Card */}
        <BalanceSummaryCard
          netBalances={netBalances}
          simplifiedDebts={simplifiedDebts}
          members={members}
          onMemberPress={handleMemberPress}
          loading={balancesLoading}
          currentUserId={user?.id}
        />

        {/* Quick action buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.addButton} onPress={handleOpenAddExpense}>
            <Text style={styles.addButtonText}>+ Add Expense</Text>
          </Pressable>
          <Pressable
            style={styles.cameraButton}
            onPress={handleScanReceipt}
            accessibilityLabel="Scan Receipt"
          >
            <Text style={styles.cameraIcon}>📷</Text>
          </Pressable>
        </View>

        {/* Recent Expenses section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>

          {showSkeleton ? (
            <View style={styles.expenseList}>
              <ExpenseSkeletonCard />
              <ExpenseSkeletonCard />
              <ExpenseSkeletonCard />
            </View>
          ) : expenses.length === 0 ? (
            <View style={styles.emptyCard}>
              {hasHousehold ? (
                <>
                  <Text style={styles.emptyHeading}>Split expenses fairly</Text>
                  <Text style={styles.emptyBody}>
                    Add an expense or scan a receipt — Jolly will handle the math.
                  </Text>
                  <View style={styles.emptyActions}>
                    <Pressable style={styles.emptyButton} onPress={handleOpenAddExpense}>
                      <Text style={styles.emptyButtonText}>Add Expense</Text>
                    </Pressable>
                    <Pressable style={styles.emptyButtonSecondary} onPress={handleScanReceipt}>
                      <Text style={styles.emptyButtonSecondaryText}>Scan Receipt</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.emptyHeading}>Track your spending</Text>
                  <Text style={styles.emptyBody}>
                    Add your first expense to start tracking. Your balance will appear here.
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.expenseList}>
              {expenses.slice(0, 10).map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onPress={() => handleExpensePress(expense)}
                />
              ))}
              <Pressable style={styles.seeAllLink} onPress={() => router.push('/expense-history')}>
                <Text style={styles.seeAllText}>See all expenses →</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Recurring section — placeholder, functional in Plan 05 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurring</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyBody}>
              Recurring expenses coming soon.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Debt Detail Sheet */}
      <DebtDetailSheet
        visible={!!selectedDebtMember}
        onClose={() => setSelectedDebtMember(null)}
        debt={simplifiedDebts.find(
          (d) =>
            d.from === selectedDebtMember?.userId ||
            d.to === selectedDebtMember?.userId
        ) ?? null}
        memberName={selectedDebtMember?.name ?? ''}
        memberId={selectedDebtMember?.userId ?? ''}
        onSettled={() => {
          loadBalances();
        }}
      />

      {/* Expense Detail Sheet */}
      <ExpenseDetailSheet
        visible={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onUpdate={() => {
          loadExpenses();
          loadBalances();
          setSelectedExpense(null);
        }}
      />

      {/* Bottom Sheet for Quick Add */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Add Expense</Text>
          <QuickAddCard
            onSave={handleSaveExpense}
            members={members}
            presets={presets}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 64,
  },
  scrollContentOffline: {
    paddingTop: 52,
  },
  jollyInput: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
    minHeight: 52,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  expenseList: {
    gap: 8,
  },
  emptyCard: {
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  emptyButtonSecondary: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  seeAllLink: {
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 20,
  },
  bottomSheetBackground: {
    backgroundColor: colors.dominant.light,
  },
  bottomSheetHandle: {
    backgroundColor: colors.border.light,
  },
  bottomSheetContent: {
    paddingBottom: 32,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
});
