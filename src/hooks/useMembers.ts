import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import { captureEvent } from '@/lib/posthog';

export interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  joined_at: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    dietary_preferences: string[];
  };
}

export function useMembers(householdId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { userRole, reset: resetHouseholdStore } = useHouseholdStore();

  async function loadMembers(): Promise<void> {
    if (!householdId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('household_members')
        .select('*, profile:profiles(display_name, avatar_url, dietary_preferences)')
        .eq('household_id', householdId)
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: Member[] = (data ?? []).map((row: {
        id: string;
        user_id: string;
        role: string;
        status: string;
        joined_at: string;
        profile: { display_name: string | null; avatar_url: string | null; dietary_preferences: string[] | null } | null;
      }) => ({
        id: row.id,
        user_id: row.user_id,
        role: row.role as 'admin' | 'member',
        status: row.status as 'active' | 'pending',
        joined_at: row.joined_at,
        profile: {
          display_name: row.profile?.display_name ?? null,
          avatar_url: row.profile?.avatar_url ?? null,
          dietary_preferences: row.profile?.dietary_preferences ?? [],
        },
      }));

      setMembers(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function removeMember(memberId: string): Promise<void> {
    if (userRole !== 'admin') throw new Error('Only admins can remove members');

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateMemberRole(memberId: string, role: 'admin' | 'member'): Promise<void> {
    if (userRole !== 'admin') throw new Error('Only admins can change roles');

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('household_members')
        .update({ role })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update member role';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function leaveHousehold(): Promise<void> {
    if (!user || !householdId) throw new Error('Not authenticated or no active household');

    setIsLoading(true);
    setError(null);

    try {
      // Check if user is the last admin
      const adminCount = members.filter((m) => m.role === 'admin' && m.status === 'active').length;
      const userMember = members.find((m) => m.user_id === user.id);
      if (userMember?.role === 'admin' && adminCount === 1 && members.filter((m) => m.status === 'active').length > 1) {
        throw new Error('You are the last admin. Promote another member to admin before leaving.');
      }

      // Delete own membership
      const { error: deleteError } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Clear active_household_id on profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_household_id: null })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Clear Zustand store
      resetHouseholdStore();

      // Track analytics
      captureEvent('household_left', { household_id: householdId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave household';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function approveMember(memberId: string): Promise<void> {
    if (userRole !== 'admin') throw new Error('Only admins can approve members');

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('household_members')
        .update({ status: 'active' })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: 'active' as const } : m))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve member';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    members,
    loadMembers,
    removeMember,
    updateMemberRole,
    leaveHousehold,
    approveMember,
    isLoading,
    error,
  };
}
