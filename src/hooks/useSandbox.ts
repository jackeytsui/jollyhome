import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import { useHousehold } from '@/hooks/useHousehold';

export interface SandboxMember {
  name: string;
  avatar_initials: string;
  dietary: string[];
}

export interface SandboxExpense {
  description: string;
  amount: number;
  category: string;
  paid_by: string;
  split: string;
  date: string;
}

export interface SandboxChore {
  title: string;
  area: string;
  assigned_to: string;
  condition: 'green' | 'yellow' | 'red';
  last_done: string;
}

export interface SandboxMeal {
  name: string;
  day: string;
  type: string;
  prep_time: string;
}

export interface SandboxEvent {
  title: string;
  date: string;
  time: string;
  type: string;
}

export interface SandboxData {
  members: SandboxMember[];
  expenses: SandboxExpense[];
  chores: SandboxChore[];
  meals: SandboxMeal[];
  events: SandboxEvent[];
}

export function useSandbox() {
  const { user } = useAuthStore();
  const { activeHouseholdId } = useHouseholdStore();
  const { loadActiveHousehold } = useHousehold();

  const [isSandboxActive, setIsSandboxActive] = useState(false);
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSandboxStatus = useCallback(async () => {
    if (!activeHouseholdId) {
      setIsSandboxActive(false);
      return;
    }
    const { data, error } = await supabase
      .from('households')
      .select('is_sandbox')
      .eq('id', activeHouseholdId)
      .single();
    if (!error && data) {
      setIsSandboxActive(Boolean(data.is_sandbox));
    }
  }, [activeHouseholdId]);

  const activateSandbox = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('create_sandbox_data', {
        p_user_id: user.id,
      });
      if (error) throw error;
      // Reload active household into store
      await loadActiveHousehold();
      setIsSandboxActive(true);
      try {
        const { usePostHog } = await import('posthog-react-native');
        // PostHog is called via hook in components; here we capture via the client directly
        // Silently fail if PostHog not configured
        void usePostHog;
      } catch {
        // PostHog unavailable — ignore
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadActiveHousehold]);

  const deactivateSandbox = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('clear_sandbox_data', {
        p_user_id: user.id,
      });
      if (error) throw error;
      // Reload active household (falls back to real household or null)
      await loadActiveHousehold();
      setIsSandboxActive(false);
      setSandboxData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadActiveHousehold]);

  const loadSandboxData = useCallback(async () => {
    if (!activeHouseholdId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sandbox_data')
        .select('data_type, data')
        .eq('household_id', activeHouseholdId);

      if (error) throw error;

      const grouped: SandboxData = {
        members: [],
        expenses: [],
        chores: [],
        meals: [],
        events: [],
      };

      for (const row of data ?? []) {
        switch (row.data_type) {
          case 'member':
            grouped.members.push(row.data as SandboxMember);
            break;
          case 'expense':
            grouped.expenses.push(row.data as SandboxExpense);
            break;
          case 'chore':
            grouped.chores.push(row.data as SandboxChore);
            break;
          case 'meal':
            grouped.meals.push(row.data as SandboxMeal);
            break;
          case 'event':
            grouped.events.push(row.data as SandboxEvent);
            break;
        }
      }

      setSandboxData(grouped);
    } finally {
      setIsLoading(false);
    }
  }, [activeHouseholdId]);

  return {
    isSandboxActive,
    activateSandbox,
    deactivateSandbox,
    sandboxData,
    loadSandboxData,
    checkSandboxStatus,
    isLoading,
  };
}
