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
  instance_id: string | null;
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

interface MemberEnergyEntryRecord {
  id: string;
  household_id: string;
  member_user_id: string;
  energy_level: 'low' | 'medium' | 'high';
  effective_date: string;
  note: string | null;
  created_at: string;
}

interface HouseholdChoreSettingsRecord {
  household_id: string;
  gamification_enabled: boolean;
  streaks_enabled: boolean;
  leaderboard_enabled: boolean;
  bonus_claim_window_hours: number;
  created_at: string;
  updated_at: string;
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
  assignedMemberIds?: string[];
}

interface ChoreUpdateInput extends Partial<ChoreInput> {
  is_archived?: boolean;
}

export function useChores() {
  const [templates, setTemplates] = useState<ChoreTemplateRecord[]>([]);
  const [assignments, setAssignments] = useState<ChoreAssignmentRecord[]>([]);
  const [instances, setInstances] = useState<ChoreInstanceRecord[]>([]);
  const [completions, setCompletions] = useState<ChoreCompletionRecord[]>([]);
  const [energyEntries, setEnergyEntries] = useState<MemberEnergyEntryRecord[]>([]);
  const [settings, setSettings] = useState<HouseholdChoreSettingsRecord | null>(null);
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
      setEnergyEntries([]);
      setSettings(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [templatesResult, assignmentsResult, instancesResult, completionsResult, energyEntriesResult, settingsResult] = await Promise.all([
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
        supabase
          .from('member_energy_entries')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('effective_date', { ascending: false }),
        supabase
          .from('household_chore_settings')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .maybeSingle(),
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (instancesResult.error) throw instancesResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (energyEntriesResult.error) throw energyEntriesResult.error;
      if (settingsResult.error) throw settingsResult.error;

      setTemplates((templatesResult.data as ChoreTemplateRecord[]) ?? []);
      setAssignments((assignmentsResult.data as ChoreAssignmentRecord[]) ?? []);
      setInstances((instancesResult.data as ChoreInstanceRecord[]) ?? []);
      setCompletions((completionsResult.data as ChoreCompletionRecord[]) ?? []);
      setEnergyEntries((energyEntriesResult.data as MemberEnergyEntryRecord[]) ?? []);
      setSettings((settingsResult.data as HouseholdChoreSettingsRecord | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chores');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const syncAssignments = useCallback(async (
    templateId: string,
    memberIds: string[],
    scheduledFor: string | null,
    instanceId: string | null
  ): Promise<void> => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const existingQuery = supabase
      .from('chore_assignments')
      .select('id, member_user_id, instance_id')
      .eq('template_id', templateId);

    const existingResult = instanceId
      ? await existingQuery.eq('instance_id', instanceId)
      : await existingQuery.is('instance_id', null);

    if (existingResult.error) {
      throw existingResult.error;
    }

    const existingAssignments = (existingResult.data as Array<{
      id: string;
      member_user_id: string;
      instance_id: string | null;
    }>) ?? [];

    const keep = new Set(memberIds);
    const toDelete = existingAssignments
      .filter((assignment) => !keep.has(assignment.member_user_id))
      .map((assignment) => assignment.id);

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('chore_assignments')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    const existingMemberIds = new Set(existingAssignments.map((assignment) => assignment.member_user_id));
    const inserts = memberIds
      .filter((memberId) => !existingMemberIds.has(memberId))
      .map((memberId) => ({
        household_id: activeHouseholdId,
        template_id: templateId,
        instance_id: instanceId,
        member_user_id: memberId,
        assigned_for: scheduledFor,
        assignment_status: 'assigned',
        suggested_by: 'manual',
      }));

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('chore_assignments')
        .insert(inserts);

      if (insertError) {
        throw insertError;
      }
    }
  }, [activeHouseholdId]);

  const createChore = useCallback(async (input: ChoreInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const templateInsert = await supabase.from('chore_templates').insert({
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
    }).select('*').single();

    if (templateInsert.error) {
      throw templateInsert.error;
    }

    const template = templateInsert.data as ChoreTemplateRecord | null;

    let instanceId: string | null = null;
    const scheduledFor = input.next_occurrence_at ?? input.recurrence_anchor;

    if (template) {
      const instanceInsert = await supabase
        .from('chore_instances')
        .insert({
          household_id: activeHouseholdId,
          template_id: template.id,
          scheduled_for: scheduledFor,
          due_window_end: scheduledFor,
          status: input.kind === 'bonus' ? 'open' : 'open',
        })
        .select('id')
        .single();

      if (instanceInsert.error) {
        throw instanceInsert.error;
      }

      instanceId = (instanceInsert.data as { id: string } | null)?.id ?? null;
    }

    if (template && input.assignedMemberIds && input.assignedMemberIds.length > 0) {
      await syncAssignments(template.id, input.assignedMemberIds, scheduledFor, instanceId);
    }

    await loadChores();
  }, [activeHouseholdId, loadChores, syncAssignments, user]);

  const updateChore = useCallback(async (id: string, updates: ChoreUpdateInput): Promise<void> => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const { assignedMemberIds, ...templateUpdates } = updates as ChoreUpdateInput & { assignedMemberIds?: string[] };
    const { error: updateError } = await supabase.from('chore_templates').update(templateUpdates).eq('id', id);

    if (updateError) {
      throw updateError;
    }

    if (assignedMemberIds) {
      const instanceResult = await supabase
        .from('chore_instances')
        .select('id, scheduled_for')
        .eq('template_id', id)
        .neq('status', 'completed')
        .order('scheduled_for', { ascending: true })
        .limit(1)
        .single();

      let instanceId: string | null = null;
      let scheduledFor = updates.next_occurrence_at ?? updates.recurrence_anchor ?? null;

      if (instanceResult.error) {
        const templateResult = await supabase
          .from('chore_templates')
          .select('household_id, next_occurrence_at, recurrence_anchor')
          .eq('id', id)
          .single();

        if (templateResult.error) {
          throw templateResult.error;
        }

        const templateData = templateResult.data as {
          household_id: string;
          next_occurrence_at: string | null;
          recurrence_anchor: string;
        };

        scheduledFor = scheduledFor ?? templateData.next_occurrence_at ?? templateData.recurrence_anchor;

        const newInstance = await supabase
          .from('chore_instances')
          .insert({
            household_id: templateData.household_id,
            template_id: id,
            scheduled_for: scheduledFor,
            due_window_end: scheduledFor,
          })
          .select('id')
          .single();

        if (newInstance.error) {
          throw newInstance.error;
        }

        instanceId = (newInstance.data as { id: string } | null)?.id ?? null;
      } else {
        const instanceData = instanceResult.data as { id: string; scheduled_for: string | null };
        instanceId = instanceData.id;
        scheduledFor = instanceData.scheduled_for;
      }

      await syncAssignments(id, assignedMemberIds, scheduledFor, instanceId);
    }

    await loadChores();
  }, [activeHouseholdId, loadChores, syncAssignments]);

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

    await loadChores();
  }, [activeHouseholdId, loadChores, user]);

  const updateHouseholdSettings = useCallback(async (
    updates: Partial<Pick<
      HouseholdChoreSettingsRecord,
      'gamification_enabled' | 'streaks_enabled' | 'leaderboard_enabled' | 'bonus_claim_window_hours'
    >>
  ): Promise<void> => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const { error: upsertError } = await supabase
      .from('household_chore_settings')
      .upsert({
        household_id: activeHouseholdId,
        ...updates,
      });

    if (upsertError) {
      throw upsertError;
    }

    await loadChores();
  }, [activeHouseholdId, loadChores]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_energy_entries', filter: `household_id=eq.${activeHouseholdId}` }, loadChores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_chore_settings', filter: `household_id=eq.${activeHouseholdId}` }, loadChores)
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
    energyEntries,
    settings,
    loading,
    error,
    loadChores,
    createChore,
    updateChore,
    completeChore,
    claimBonusChore,
    upsertEnergyEntry,
    updateHouseholdSettings,
  };
}
