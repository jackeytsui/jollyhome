import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { useAttendance } from '@/hooks/useAttendance';
import type { AttendanceStatus } from '@/types/calendar';

export interface AttendanceAction {
  label: string;
  status: AttendanceStatus;
}

export const ATTENDANCE_ACTIONS: AttendanceAction[] = [
  { label: 'Home tonight', status: 'home_tonight' },
  { label: 'Away tonight', status: 'away_tonight' },
];

interface AttendanceToggleStripProps {
  date?: string;
  note?: string | null;
  value?: AttendanceStatus | null;
  onSaved?: (status: AttendanceStatus) => void;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceToggleStrip({
  date = getTodayDate(),
  note = null,
  value = null,
  onSaved,
}: AttendanceToggleStripProps) {
  const { upsertAttendance } = useAttendance();
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);

  async function handlePress(status: AttendanceStatus) {
    setPendingStatus(status);

    try {
      await upsertAttendance(date, status, note);
      onSaved?.(status);
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.caption}>One tap for tonight&apos;s meal and chore planning.</Text>
      </View>
      <View style={styles.row}>
        {ATTENDANCE_ACTIONS.map((action) => (
          <View key={action.status} style={styles.action}>
            <Button
              label={action.label}
              variant={value === action.status ? 'primary' : 'secondary'}
              loading={pendingStatus === action.status}
              onPress={() => {
                void handlePress(action.status);
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
  },
});
