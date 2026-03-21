import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useHouseholdStore } from '@/stores/household';
import { computeBalances, simplifyDebts } from '@/lib/expenseMath';
import type { LedgerEntry, Balance, Settlement } from '@/types/expenses';

export function useBalances() {
  const [netBalances, setNetBalances] = useState<Record<string, number>>({});
  const [simplifiedDebts, setSimplifiedDebts] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);

  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  const loadSettlements = useCallback(async (): Promise<Settlement[]> => {
    if (!activeHouseholdId) return [];

    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fetched = (data ?? []) as Settlement[];
      setSettlements(fetched);
      return fetched;
    } catch {
      return [];
    }
  }, [activeHouseholdId]);

  const loadBalances = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) return;

    setLoading(true);

    try {
      // Fetch all non-deleted expenses with splits
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('id, paid_by, expense_splits(user_id, amount_cents)')
        .eq('household_id', activeHouseholdId)
        .is('deleted_at', null);

      if (expensesError) throw expensesError;

      // Transform to LedgerEntry[]
      const entries: LedgerEntry[] = (expensesData ?? []).map((exp: {
        id: string;
        paid_by: string;
        expense_splits: { user_id: string; amount_cents: number }[];
      }) => ({
        paidBy: exp.paid_by,
        splits: exp.expense_splits.map((s) => ({
          userId: s.user_id,
          amount: s.amount_cents,
        })),
      }));

      // Fetch settlements and adjust net positions
      const fetchedSettlements = await loadSettlements();

      // Compute raw net balances from expenses
      const rawNet = computeBalances(entries);

      // Apply settlements: from_user_id pays to_user_id, so:
      // from_user gets credit (net goes up), to_user loses credit (net goes down)
      const adjustedNet: Record<string, number> = { ...rawNet };
      for (const s of fetchedSettlements) {
        adjustedNet[s.from_user_id] = (adjustedNet[s.from_user_id] ?? 0) + s.amount_cents;
        adjustedNet[s.to_user_id] = (adjustedNet[s.to_user_id] ?? 0) - s.amount_cents;
      }

      const simplified = simplifyDebts(adjustedNet);

      setNetBalances(adjustedNet);
      setSimplifiedDebts(simplified);
    } catch {
      // Silently preserve existing state on error
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, loadSettlements]);

  useEffect(() => {
    if (!activeHouseholdId) return;

    loadBalances();

    // Realtime subscription to both expenses and settlements
    const channel = supabase
      .channel(`household:${activeHouseholdId}:balances`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `household_id=eq.${activeHouseholdId}`,
        },
        () => {
          loadBalances();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
          filter: `household_id=eq.${activeHouseholdId}`,
        },
        () => {
          loadBalances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadBalances]);

  return {
    netBalances,
    simplifiedDebts,
    settlements,
    loading,
    loadBalances,
    loadSettlements,
  };
}
