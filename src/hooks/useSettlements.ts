import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { Settlement, PaymentPreferences } from '@/types/expenses';

export function useSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [paymentPrefs, setPaymentPrefs] = useState<PaymentPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const { activeHouseholdId } = useHouseholdStore();

  const loadSettlements = useCallback(async (otherUserId?: string): Promise<void> => {
    if (!activeHouseholdId || !user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('settlements')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: false });

      if (otherUserId) {
        // Filter to settlements between current user and otherUserId
        query = query.or(
          `and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setSettlements((data as Settlement[]) ?? []);
    } catch (err) {
      // Non-fatal: leave settlements as-is
      console.warn('loadSettlements error:', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, user]);

  const createSettlement = useCallback(async (
    toUserId: string,
    amountCents: number,
    paymentMethod?: string,
    note?: string,
  ): Promise<boolean> => {
    if (!activeHouseholdId || !user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('settlements')
        .insert({
          household_id: activeHouseholdId,
          from_user_id: user.id,
          to_user_id: toUserId,
          amount_cents: amountCents,
          payment_method: paymentMethod ?? null,
          note: note ?? null,
        });

      if (error) throw error;

      // Reload settlements for this pair
      await loadSettlements(toUserId);
      return true;
    } catch (err) {
      console.warn('createSettlement error:', err instanceof Error ? err.message : err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, user, loadSettlements]);

  const loadPaymentPrefs = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('payment_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        throw error;
      }

      setPaymentPrefs((data as PaymentPreferences) ?? null);
    } catch (err) {
      console.warn('loadPaymentPrefs error:', err instanceof Error ? err.message : err);
    }
  }, []);

  const updatePaymentPrefs = useCallback(async (prefs: Partial<PaymentPreferences>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('payment_preferences')
        .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' });

      if (error) throw error;

      // Reload updated prefs
      await loadPaymentPrefs(user.id);
      return true;
    } catch (err) {
      console.warn('updatePaymentPrefs error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, [user, loadPaymentPrefs]);

  return {
    settlements,
    paymentPrefs,
    loading,
    loadSettlements,
    createSettlement,
    loadPaymentPrefs,
    updatePaymentPrefs,
  };
}
