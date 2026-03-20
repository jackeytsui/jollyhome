import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import { captureEvent } from '@/lib/posthog';

interface Household {
  id: string;
  name: string;
  avatar_url: string | null;
  is_sandbox: boolean;
  join_approval_required: boolean;
  invite_expiry_days: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useHousehold() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { setActiveHousehold, setMemberCount } = useHouseholdStore();

  async function createHousehold(name: string, avatarUrl?: string): Promise<Household> {
    if (!user) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      // Insert household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ name, avatar_url: avatarUrl ?? null, created_by: user.id })
        .select()
        .single();

      if (householdError) throw householdError;
      if (!household) throw new Error('Failed to create household');

      // Insert creator as admin member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'admin',
          status: 'active',
        });

      if (memberError) throw memberError;

      // Update profile's active household
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_household_id: household.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update Zustand store
      setActiveHousehold(household.id, household.name, 'admin');
      setMemberCount(1);

      // Track analytics
      captureEvent('household_created', { household_id: household.id });

      return household as Household;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create household';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function loadActiveHousehold(): Promise<void> {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile's active_household_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('active_household_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.active_household_id) {
        setActiveHousehold(null, null, null);
        setIsLoading(false);
        return;
      }

      const householdId = profile.active_household_id;

      // Fetch household data
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('id, name, avatar_url')
        .eq('id', householdId)
        .single();

      if (householdError) throw householdError;

      // Fetch user's membership role
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', householdId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError) throw membershipError;

      // Fetch member count
      const { count, error: countError } = await supabase
        .from('household_members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .eq('status', 'active');

      if (countError) throw countError;

      // Update Zustand store
      setActiveHousehold(
        household.id,
        household.name,
        membership.role as 'admin' | 'member'
      );
      setMemberCount(count ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load household';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function switchHousehold(householdId: string): Promise<void> {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_household_id: householdId })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await loadActiveHousehold();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch household';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateHousehold(
    id: string,
    updates: Partial<Pick<Household, 'name' | 'avatar_url' | 'join_approval_required' | 'invite_expiry_days'>>
  ): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('households')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // If name changed, update store
      if (updates.name) {
        const { activeHouseholdId, userRole } = useHouseholdStore.getState();
        if (activeHouseholdId === id) {
          setActiveHousehold(id, updates.name, userRole);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update household';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    createHousehold,
    loadActiveHousehold,
    switchHousehold,
    updateHousehold,
    isLoading,
    error,
  };
}
