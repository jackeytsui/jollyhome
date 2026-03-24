import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { CreateExpenseInput } from '@/types/expenses';
import type {
  MaintenanceAppointmentInput,
  MaintenanceExpensePrefillInput,
  MaintenanceHistoryFilters,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceRequestInput,
  MaintenanceStatus,
  MaintenanceStatusUpdateInput,
  MaintenanceUpdate,
  MaintenanceUpdateType,
} from '@/types/maintenance';

const REALTIME_CHANNEL_NAME = (householdId: string) => `household:${householdId}:maintenance-house-rules`;

interface MaintenanceRequestRow {
  id: string;
  household_id: string;
  created_by: string;
  title: string;
  description: string | null;
  area: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  resolved_at: string | null;
  cost_cents: number | string | null;
  latest_note: string | null;
  latest_photo_path: string | null;
  appointment_event_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MaintenanceUpdateRow {
  id: string;
  household_id: string;
  request_id: string;
  created_by: string | null;
  update_type: MaintenanceUpdateType;
  note: string | null;
  photo_path: string | null;
  from_status: MaintenanceStatus | null;
  to_status: MaintenanceStatus | null;
  cost_cents: number | string | null;
  appointment_event_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapMaintenanceRequest(row: MaintenanceRequestRow): MaintenanceRequest {
  return {
    id: row.id,
    householdId: row.household_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    area: row.area,
    priority: row.priority,
    status: row.status,
    claimedBy: row.claimed_by,
    claimedAt: row.claimed_at,
    resolvedAt: row.resolved_at,
    costCents: toNumber(row.cost_cents),
    latestNote: row.latest_note,
    latestPhotoPath: row.latest_photo_path,
    appointmentEventId: row.appointment_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMaintenanceUpdate(row: MaintenanceUpdateRow): MaintenanceUpdate {
  return {
    id: row.id,
    householdId: row.household_id,
    requestId: row.request_id,
    createdBy: row.created_by,
    updateType: row.update_type,
    note: row.note,
    photoPath: row.photo_path,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    costCents: toNumber(row.cost_cents),
    appointmentEventId: row.appointment_event_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

const STATUS_SORT_ORDER: MaintenanceStatus[] = ['open', 'claimed', 'in_progress', 'resolved'];

const PRIORITY_SORT_ORDER: MaintenancePriority[] = ['urgent', 'high', 'medium', 'low'];

export function sortMaintenanceRequests(items: MaintenanceRequest[]): MaintenanceRequest[] {
  return [...items].sort((left, right) => {
    const leftStatusIndex = STATUS_SORT_ORDER.indexOf(left.status);
    const rightStatusIndex = STATUS_SORT_ORDER.indexOf(right.status);
    if (leftStatusIndex !== rightStatusIndex) {
      return leftStatusIndex - rightStatusIndex;
    }

    const leftPriorityIndex = PRIORITY_SORT_ORDER.indexOf(left.priority);
    const rightPriorityIndex = PRIORITY_SORT_ORDER.indexOf(right.priority);
    if (leftPriorityIndex !== rightPriorityIndex) {
      return leftPriorityIndex - rightPriorityIndex;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function filterMaintenanceHistory(
  items: MaintenanceRequest[],
  filters: MaintenanceHistoryFilters
): MaintenanceRequest[] {
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.priority !== 'all' && item.priority !== filters.priority) {
      return false;
    }

    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    if (filters.area !== 'all' && (item.area ?? 'Unassigned') !== filters.area) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      item.title,
      item.description,
      item.area,
      item.latestNote,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function getMaintenanceStatusActionLabel(status: MaintenanceStatus): string {
  switch (status) {
    case 'open':
      return 'Claim';
    case 'claimed':
      return 'Start work';
    case 'in_progress':
      return 'Resolve';
    case 'resolved':
      return 'Resolved';
  }
}

export function getNextMaintenanceStatus(status: MaintenanceStatus): MaintenanceStatus | null {
  switch (status) {
    case 'open':
      return 'claimed';
    case 'claimed':
      return 'in_progress';
    case 'in_progress':
      return 'resolved';
    case 'resolved':
      return null;
  }
}

export function buildMaintenanceAppointmentPayload(
  request: MaintenanceRequest,
  input: MaintenanceAppointmentInput
) {
  return {
    activity_type: 'maintenance' as const,
    title: input.title?.trim() || request.title,
    description: input.description ?? request.description ?? null,
    location: input.location ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    timezone: 'UTC',
    all_day: false,
    recurrence_rule: null,
    recurrence_timezone: 'UTC',
    recurrence_anchor: input.startsAt,
    icon_key: 'wrench',
    visual_weight: 'secondary' as const,
    owner_member_user_ids: input.ownerMemberUserIds ?? [],
  };
}

export function buildMaintenanceExpensePrefill(
  input: MaintenanceExpensePrefillInput
): Partial<CreateExpenseInput> {
  const total = input.request.costCents ?? 0;
  const memberCount = Math.max(1, input.memberUserIds.length);
  const baseShare = Math.floor(total / memberCount);
  const remainder = total - baseShare * memberCount;

  return {
    household_id: input.householdId,
    description: `${input.request.title} repair`,
    amount_cents: total,
    category: 'home',
    paid_by: input.paidBy,
    split_type: 'exact',
    splits: input.memberUserIds.map((userId, index) => ({
      user_id: userId,
      amount_cents: baseShare + (index < remainder ? 1 : 0),
    })),
    expense_date: new Date().toISOString().slice(0, 10),
  };
}

export function useMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [updates, setUpdates] = useState<MaintenanceUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadMaintenance = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setRequests([]);
      setUpdates([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [requestsResult, updatesResult] = await Promise.all([
        supabase
          .from('maintenance_requests')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('maintenance_updates')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('created_at', { ascending: false }),
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (updatesResult.error) throw updatesResult.error;

      setRequests(((requestsResult.data ?? []) as MaintenanceRequestRow[]).map(mapMaintenanceRequest));
      setUpdates(((updatesResult.data ?? []) as MaintenanceUpdateRow[]).map(mapMaintenanceUpdate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maintenance');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    loadMaintenance();
  }, [loadMaintenance]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    const channel = supabase
      .channel(REALTIME_CHANNEL_NAME(activeHouseholdId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests', filter: `household_id=eq.${activeHouseholdId}` }, loadMaintenance)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_updates', filter: `household_id=eq.${activeHouseholdId}` }, loadMaintenance)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadMaintenance]);

  const recordUpdate = useCallback(async (
    requestId: string,
    update: {
      updateType: MaintenanceUpdateType;
      note?: string | null;
      photoPath?: string | null;
      fromStatus?: MaintenanceStatus | null;
      toStatus?: MaintenanceStatus | null;
      costCents?: number | null;
      appointmentEventId?: string | null;
      metadata?: Record<string, unknown> | null;
    }
  ): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { error: insertError } = await supabase.from('maintenance_updates').insert({
      household_id: activeHouseholdId,
      request_id: requestId,
      created_by: user.id,
      update_type: update.updateType,
      note: update.note ?? null,
      photo_path: update.photoPath ?? null,
      from_status: update.fromStatus ?? null,
      to_status: update.toStatus ?? null,
      cost_cents: update.costCents ?? null,
      appointment_event_id: update.appointmentEventId ?? null,
      metadata: update.metadata ?? {},
    });

    if (insertError) {
      throw insertError;
    }
  }, [activeHouseholdId, user]);

  const createRequest = useCallback(async (input: MaintenanceRequestInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { data, error: insertError } = await supabase
      .from('maintenance_requests')
      .insert({
        household_id: activeHouseholdId,
        created_by: user.id,
        title: input.title.trim(),
        description: input.description ?? null,
        area: input.area ?? null,
        priority: input.priority ?? 'medium',
        status: 'open',
        cost_cents: input.costCents ?? null,
        latest_note: input.note ?? null,
        latest_photo_path: input.photoPath ?? null,
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    const request = mapMaintenanceRequest(data as MaintenanceRequestRow);

    if (input.note || input.photoPath || input.costCents) {
      await recordUpdate(request.id, {
        updateType: input.photoPath ? 'photo' : input.costCents ? 'cost' : 'note',
        note: input.note ?? null,
        photoPath: input.photoPath ?? null,
        costCents: input.costCents ?? null,
      });
    }

    await loadMaintenance();
  }, [activeHouseholdId, loadMaintenance, recordUpdate, user]);

  const updateRequest = useCallback(async (
    requestId: string,
    updatesInput: Partial<MaintenanceRequestInput>
  ): Promise<void> => {
    const payload: Record<string, unknown> = {};

    if (updatesInput.title !== undefined) payload.title = updatesInput.title.trim();
    if (updatesInput.description !== undefined) payload.description = updatesInput.description;
    if (updatesInput.area !== undefined) payload.area = updatesInput.area;
    if (updatesInput.priority !== undefined) payload.priority = updatesInput.priority;
    if (updatesInput.note !== undefined) payload.latest_note = updatesInput.note;
    if (updatesInput.photoPath !== undefined) payload.latest_photo_path = updatesInput.photoPath;
    if (updatesInput.costCents !== undefined) payload.cost_cents = updatesInput.costCents;

    const { error: updateError } = await supabase
      .from('maintenance_requests')
      .update(payload)
      .eq('id', requestId);

    if (updateError) {
      throw updateError;
    }

    if (
      updatesInput.note !== undefined ||
      updatesInput.photoPath !== undefined ||
      updatesInput.costCents !== undefined
    ) {
      await recordUpdate(requestId, {
        updateType: updatesInput.photoPath ? 'photo' : updatesInput.costCents !== undefined ? 'cost' : 'note',
        note: updatesInput.note ?? null,
        photoPath: updatesInput.photoPath ?? null,
        costCents: updatesInput.costCents ?? null,
      });
    }

    await loadMaintenance();
  }, [loadMaintenance, recordUpdate]);

  const updateStatus = useCallback(async (
    requestId: string,
    input: MaintenanceStatusUpdateInput
  ): Promise<void> => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const current = requests.find((item) => item.id === requestId);
    if (!current) {
      throw new Error('Maintenance request not found');
    }

    const nextFields: Record<string, unknown> = {
      status: input.status,
      latest_note: input.note ?? current.latestNote,
      latest_photo_path: input.photoPath ?? current.latestPhotoPath,
      cost_cents: input.costCents ?? current.costCents,
    };

    if (input.status === 'claimed') {
      nextFields.claimed_by = user.id;
      nextFields.claimed_at = new Date().toISOString();
    }

    if (input.status === 'resolved') {
      nextFields.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('maintenance_requests')
      .update(nextFields)
      .eq('id', requestId);

    if (updateError) {
      throw updateError;
    }

    await recordUpdate(requestId, {
      updateType: 'status',
      note: input.note ?? null,
      photoPath: input.photoPath ?? null,
      fromStatus: current.status,
      toStatus: input.status,
      costCents: input.costCents ?? current.costCents,
    });

    await loadMaintenance();
  }, [loadMaintenance, recordUpdate, requests, user]);

  const scheduleAppointment = useCallback(async (
    requestId: string,
    input: MaintenanceAppointmentInput
  ): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const request = requests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error('Maintenance request not found');
    }

    const eventPayload = buildMaintenanceAppointmentPayload(request, input);
    const { data, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        household_id: activeHouseholdId,
        created_by: user.id,
        ...eventPayload,
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    const appointmentEventId = (data as { id: string }).id;
    const { error: updateError } = await supabase
      .from('maintenance_requests')
      .update({
        appointment_event_id: appointmentEventId,
      })
      .eq('id', requestId);

    if (updateError) {
      throw updateError;
    }

    await recordUpdate(requestId, {
      updateType: 'appointment',
      appointmentEventId,
      note: `Scheduled appointment for ${input.startsAt}`,
      metadata: {
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location ?? null,
      },
    });

    await loadMaintenance();
  }, [activeHouseholdId, loadMaintenance, recordUpdate, requests, user]);

  const activeRequests = useMemo(
    () => sortMaintenanceRequests(requests.filter((item) => item.status !== 'resolved')),
    [requests]
  );

  const historyRequests = useMemo(
    () => sortMaintenanceRequests(requests.filter((item) => item.status === 'resolved')),
    [requests]
  );

  return {
    requests,
    activeRequests,
    historyRequests,
    updates,
    loading,
    error,
    loadMaintenance,
    createRequest,
    updateRequest,
    updateStatus,
    scheduleAppointment,
  };
}
