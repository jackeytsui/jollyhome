import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useHouseholdStore } from '@/stores/household';
import { useExpenseStore } from '@/stores/expenses';
import type { Expense, ExpenseSplit, CreateExpenseInput, SplitPreset } from '@/types/expenses';

export type ExpenseWithSplits = Expense & { expense_splits: ExpenseSplit[] };

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [presets, setPresets] = useState<SplitPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  const loadExpenses = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*, expense_splits(*)')
        .eq('household_id', activeHouseholdId)
        .is('deleted_at', null)
        .order('expense_date', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setExpenses((data ?? []) as ExpenseWithSplits[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(message);
      // Do NOT overwrite existing cached state when offline
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const loadPresets = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('split_presets')
        .select('*')
        .eq('household_id', activeHouseholdId);

      if (fetchError) throw fetchError;

      setPresets((data ?? []) as SplitPreset[]);
    } catch {
      // Presets are optional; silently ignore errors
    }
  }, [activeHouseholdId]);

  async function createExpense(input: CreateExpenseInput): Promise<void> {
    // Check network connectivity via a simple timeout approach
    // If Supabase is unreachable, the error will be caught and queued
    try {
      const { error: rpcError } = await supabase.rpc('create_expense', {
        p_household_id: input.household_id,
        p_description: input.description,
        p_amount_cents: input.amount_cents,
        p_category: input.category,
        p_paid_by: input.paid_by,
        p_split_type: input.split_type,
        p_splits: JSON.stringify(input.splits),
        p_tax_cents: input.tax_cents ?? 0,
        p_tip_cents: input.tip_cents ?? 0,
        p_is_private: input.is_private ?? false,
        p_receipt_url: input.receipt_url ?? null,
        p_expense_date: input.expense_date ?? new Date().toISOString().split('T')[0],
      });

      if (rpcError) throw rpcError;

      // Refresh the list after successful creation
      await loadExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create expense';
      // Check if this looks like a network error — if so, queue offline
      if (
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('fetch') ||
        message.toLowerCase().includes('offline') ||
        message.toLowerCase().includes('failed to fetch')
      ) {
        useExpenseStore.getState().enqueue(input);
      } else {
        throw err;
      }
    }
  }

  useEffect(() => {
    if (!activeHouseholdId) return;

    // Load initial data
    loadExpenses();
    loadPresets();

    // Realtime subscription
    const channel = supabase
      .channel(`household:${activeHouseholdId}:expenses`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `household_id=eq.${activeHouseholdId}`,
        },
        () => {
          loadExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadExpenses, loadPresets]);

  return {
    expenses,
    loading,
    error,
    createExpense,
    loadExpenses,
    presets,
    loadPresets,
  };
}
