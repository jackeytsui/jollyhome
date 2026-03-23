import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';

const REALTIME_CHANNEL_NAME = (householdId: string) => `household:${householdId}:chores-calendar`;

interface ChoreTemplateRecord {
  id: string;
  household_id: string;
  created_by: string;
  title: string;
  description: string | null;
  area: string | null;
  estimated_minutes: number;
  recurrence_rule: string | null;
  recurrence_timezone: string;
  recurrence_anchor: string;
  next_occurrence_at: string | null;
  last_completed_at: string | null;
  kind: 'responsibility' | 'bonus';
  icon_key: string | null;
  visual_weight: 'light' | 'medium' | 'strong';
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface ChoreAssignmentRecord {
  id: string;
  household_id: string;
  template_id: string;
  member_user_id: string;
  assigned_for: string | null;
  assignment_status: 'suggested' | 'assigned' | 'accepted' | 'declined' | 'skipped';
  assignment_reason: string | null;
  suggested_by: 'ai' | 'manual';
  created_at: string;
  updated_at: string;
}

interface ChoreInstanceRecord {
  id: string;
  household_id: string;
  template_id: string;
  scheduled_for: string | null;
  due_window_end: string | null;
  status: 'open' | 'claimed' | 'completed' | 'skipped';
  claimed_by: string | null;
  claimed_at: string | null;
  projected_from_recurrence: boolean;
  created_at: string;
  updated_at: string;
}

interface ChoreCompletionRecord {
  id: string;
  household_id: string;
  template_id: string;
  instance_id: string;
  completed_by: string;
  completed_at: string;
  actual_minutes: number | null;
  note: string | null;
  photo_path: string | null;
  condition_state_at_completion: 'green' | 'yellow' | 'red' | null;
  created_at: string;
}

interface EnergyEntryInput {
  energy_level: 'low' | 'medium' | 'high';
  effective_date: string;
  note?: string | null;
}

interface ChoreInput {
  title: string;
  description?: string | null;
  area?: string | null;
  estimated_minutes: number;
  recurrence_rule?: string | null;
  recurrence_timezone?: string;
  recurrence_anchor: string;
  next_occurrence_at?: string | null;
  kind?: 'responsibility' | 'bonus';
  icon_key?: string | null;
}

interface ChoreUpdateInput extends Partial<ChoreInput> {
  is_archived?: boolean;
}

export function useChores() {
  const [templates, setTemplates] = useState<ChoreTemplateRecord[]>([]);
  const [assignments, setAssignments] = useState<ChoreAssignmentRecord[]>([]);
  const [instances, setInstances] = useState<ChoreInstanceRecord[]>([]);
  const [completions, setCompletions] = useState<ChoreCompletionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadChores = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setTemplates([]);
      setAssignments([]);
      setInstances([]);
      setCompletions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [templatesResult, assignmentsResult, instancesResult, completionsResult] = await Promise.all([
        supabase
          .from('chore_templates')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .eq('is_archived', false)
          .order('next_occurrence_at', { ascending: true }),
        supabase
          .from('chore_assignments')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('assigned_for', { ascending: true }),
        supabase
          .from('chore_instances')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('scheduled_for', { ascending: true }),
        supabase
          .from('chore_completions')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('completed_at', { ascending: false })
          .limit(100),
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (instancesResult.error) throw instancesResult.error;
      if (completionsResult.error) throw completionsResult.error;

      setTemplates((templatesResult.data as ChoreTemplateRecord[]) ?? []);
      setAssignments((assignmentsResult.data as ChoreAssignmentRecord[]) ?? []);
      setInstances((instancesResult.data as ChoreInstanceRecord[]) ?? []);
      setCompletions((completionsResult.data as ChoreCompletionRecord[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chores');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const createChore = useCallback(async (input: ChoreInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { error: insertError } = await supabase.from('chore_templates').insert({
      household_id: activeHouseholdId,
      created_by: user.id,
      title: input.title,
      description: input.description ?? null,
      area: input.area ?? null,
      estimated_minutes: input.estimated_minutes,
      recurrence_rule: input.recurrence_rule ?? null,
      recurrence_timezone: input.recurrence_timezone ?? 'UTC',
      recurrence_anchor: input.recurrence_anchor,
      next_occurrence_at: input.next_occurrence_at ?? null,
      kind: input.kind ?? 'responsibility',
      icon_key: input.icon_key ?? null,
    });

    if (insertError) {
      throw insertError;
    }

    await loadChores();
  }, [activeHouseholdId, loadChores, user]);

  const updateChore = useCallback(async (id: string, updates: ChoreUpdateInput): Promise<void> => {
    const { error: updateError } = await supabase.from('chore_templates').update(updates).eq('id', id);

    if (updateError) {
      throw updateError;
    }

    await loadChores();
  }, [loadChores]);

  const completeChore = useCallback(async (
    instanceId: string,
    input: {
      actual_minutes?: number | null;
      note?: string | null;
      photo_path?: string | null;
      condition_state?: 'green' | 'yellow' | 'red' | null;
    }
  ): Promise<void> => {
    const { error: rpcError } = await supabase.rpc('complete_chore_instance', {
      p_instance_id: instanceId,
      p_actual_minutes: input.actual_minutes ?? null,
      p_note: input.note ?? null,
      p_photo_path: input.photo_path ?? null,
      p_condition_state: input.condition_state ?? null,
    });

    if (rpcError) {
      throw rpcError;
    }

    await loadChores();
  }, [loadChores]);

  const claimBonusChore = useCallback(async (instanceId: string): Promise<void> => {
    const { error: rpcError } = await supabase.rpc('claim_bonus_chore', {
      p_instance_id: instanceId,
    });

    if (rpcError) {
      throw rpcError;
    }

    await loadChores();
  }, [loadChores]);

  const upsertEnergyEntry = useCallback(async (input: EnergyEntryInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { error: upsertError } = await supabase.from('member_energy_entries').upsert({
      household_id: activeHouseholdId,
      member_user_id: user.id,
      energy_level: input.energy_level,
      effective_date: input.effective_date,
      note: input.note ?? null,
    });

    if (upsertError) {
      throw upsertError;
    }
  }, [activeHouseholdId, user]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    loadChores();

    const channel = supabase
      .channel(REALTIME_CHANNEL_NAME(activeHouseholdId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chore_templates', filter: `household_id=eq.${activeHouseholdId}` }, loadChores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chore_assignments', filter: `household_id=eq.${activeHouseholdId}` }, loadChores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chore_instances', filter: `household_id=eq.${activeHouseholdId}` }, loadChores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chore_completions', filter: `household_id=eq.${activeHouseholdId}` }, loadChores)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadChores]);

  return {
    templates,
    assignments,
    instances,
    completions,
    loading,
    error,
    loadChores,
    createChore,
    updateChore,
    completeChore,
    claimBonusChore,
    upsertEnergyEntry,
  };
}
