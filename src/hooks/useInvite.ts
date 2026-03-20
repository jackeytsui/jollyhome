import { useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import { captureEvent } from '@/lib/posthog';
import { FREE_TIER_MEMBER_LIMIT } from '@/constants/config';

interface Invite {
  id: string;
  household_id: string;
  created_by: string;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

interface InviteInfo {
  id: string;
  household_id: string;
  household_name: string;
  household_avatar_url: string | null;
  member_count: number;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_valid: boolean;
}

export function useInvite() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { setActiveHousehold, setMemberCount } = useHouseholdStore();

  async function createInvite(
    householdId: string,
    options?: { expiryDays?: number; maxUses?: number }
  ): Promise<Invite> {
    if (!user) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      // Read household's invite_expiry_days if not provided
      let expiryDays = options?.expiryDays;
      if (expiryDays === undefined) {
        const { data: household } = await supabase
          .from('households')
          .select('invite_expiry_days')
          .eq('id', householdId)
          .single();
        expiryDays = household?.invite_expiry_days ?? 7;
      }

      const resolvedExpiryDays = expiryDays ?? 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + resolvedExpiryDays);

      const { data: invite, error: inviteError } = await supabase
        .from('household_invites')
        .insert({
          household_id: householdId,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          max_uses: options?.maxUses ?? null,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;
      if (!invite) throw new Error('Failed to create invite');

      return invite as Invite;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invite';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function getInviteInfo(token: string): Promise<InviteInfo | null> {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_household_invite', {
        invite_token: token,
      });

      if (rpcError) throw rpcError;
      if (!data || (Array.isArray(data) && data.length === 0)) return null;

      const result = Array.isArray(data) ? data[0] : data;
      return {
        id: result.id,
        household_id: result.household_id,
        household_name: result.household_name,
        household_avatar_url: result.household_avatar_url,
        member_count: Number(result.member_count),
        expires_at: result.expires_at,
        max_uses: result.max_uses,
        use_count: result.use_count,
        is_valid: result.is_valid,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get invite info';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function redeemInvite(token: string): Promise<void> {
    if (!user) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      // Validate invite first
      const inviteInfo = await getInviteInfo(token);
      if (!inviteInfo) {
        throw new Error('Invite not found or invalid');
      }

      if (!inviteInfo.is_valid) {
        // Determine whether it's expired or used up
        const isExpired =
          inviteInfo.expires_at != null && new Date(inviteInfo.expires_at) <= new Date();
        const isUsedUp =
          inviteInfo.max_uses != null && inviteInfo.use_count >= inviteInfo.max_uses;

        if (isExpired) {
          throw new Error(
            'This invite has expired. Ask your household admin to send a new one.'
          );
        }
        if (isUsedUp) {
          throw new Error(
            'This invite link has already been used. Ask your household admin for a new one.'
          );
        }
        throw new Error('This invite is no longer valid.');
      }

      // Check member limit for free tier (basic check — server enforces authoritatively)
      if (inviteInfo.member_count >= FREE_TIER_MEMBER_LIMIT) {
        throw new Error(
          'Households are limited to 6 members on the free plan. Upgrade to Plus to add more.'
        );
      }

      // Fetch household's join_approval_required setting
      const { data: household } = await supabase
        .from('households')
        .select('join_approval_required')
        .eq('id', inviteInfo.household_id)
        .single();

      const status = household?.join_approval_required ? 'pending' : 'active';

      // Insert member
      const { error: memberError } = await supabase.from('household_members').insert({
        household_id: inviteInfo.household_id,
        user_id: user.id,
        role: 'member',
        status,
      });

      if (memberError) throw memberError;

      // Increment use_count on the invite
      const { error: incrementError } = await supabase.rpc
        ? await supabase
            .from('household_invites')
            .update({ use_count: inviteInfo.use_count + 1 })
            .eq('id', inviteInfo.id)
        : { error: null };

      if (incrementError) {
        // Non-critical: log but don't block the join
        console.warn('Failed to increment use_count:', incrementError);
      }

      // Update profile's active household
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_household_id: inviteInfo.household_id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update Zustand store
      if (status === 'active') {
        setActiveHousehold(inviteInfo.household_id, inviteInfo.household_name, 'member');
        setMemberCount(inviteInfo.member_count + 1);
      }

      // Track analytics
      captureEvent('household_joined', {
        household_id: inviteInfo.household_id,
        join_status: status,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join household';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function getInviteUrl(token: string): string {
    return Linking.createURL(`/invite/${token}`);
  }

  async function listInvites(householdId: string): Promise<Invite[]> {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: listError } = await supabase
        .from('household_invites')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (listError) throw listError;
      return (data ?? []) as Invite[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list invites';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteInvite(inviteId: string): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('household_invites')
        .delete()
        .eq('id', inviteId);

      if (deleteError) throw deleteError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete invite';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    createInvite,
    getInviteInfo,
    redeemInvite,
    getInviteUrl,
    listInvites,
    deleteInvite,
    isLoading,
    error,
  };
}
