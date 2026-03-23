import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useHouseholdStore } from '@/stores/household';
import type { AttendanceStatus } from '@/types/calendar';

const REALTIME_CHANNEL_NAME = (householdId: string) => `household:${householdId}:chores-calendar`;

interface AttendanceRecord {
  id: string;
  household_id: string;
  member_user_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export function useAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);

  const loadAttendance = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setAttendance([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('member_attendance')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('attendance_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAttendance((data as AttendanceRecord[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const upsertAttendance = useCallback(async (
    attendanceDate: string,
    status: AttendanceStatus,
    note?: string | null
  ): Promise<void> => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const { error: rpcError } = await supabase.rpc('upsert_attendance_status', {
      p_household_id: activeHouseholdId,
      p_attendance_date: attendanceDate,
      p_status: status,
      p_note: note ?? null,
    });

    if (rpcError) {
      throw rpcError;
    }

    await loadAttendance();
  }, [activeHouseholdId, loadAttendance]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    loadAttendance();

    const channel = supabase
      .channel(REALTIME_CHANNEL_NAME(activeHouseholdId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_attendance', filter: `household_id=eq.${activeHouseholdId}` }, loadAttendance)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadAttendance]);

  return {
    attendance,
    loading,
    error,
    loadAttendance,
    upsertAttendance,
  };
}
