import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { getMaintenanceStatusActionLabel, getNextMaintenanceStatus } from '@/hooks/useMaintenance';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest;
  assigneeLabel?: string | null;
  onEdit: () => void;
  onAdvanceStatus: () => void;
  onScheduleAppointment: () => void;
}

function formatMoney(cents: number | null) {
  if (cents === null) {
    return null;
  }

  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_BADGE_STYLES = {
  open: { backgroundColor: '#FFE7C2' },
  claimed: { backgroundColor: '#FDE68A' },
  in_progress: { backgroundColor: '#DBEAFE' },
  resolved: { backgroundColor: '#DCFCE7' },
} as const;

export function MaintenanceRequestCard({
  request,
  assigneeLabel,
  onEdit,
  onAdvanceStatus,
  onScheduleAppointment,
}: MaintenanceRequestCardProps) {
  const nextStatus = getNextMaintenanceStatus(request.status);
  const costLabel = formatMoney(request.costCents);

  return (
    <Card style={styles.card}>
      <Pressable onPress={onEdit}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{request.title}</Text>
            <Text style={styles.meta}>
              {request.area ?? 'Unassigned area'} · {request.priority.replace('_', ' ')}
            </Text>
          </View>
          <View style={[styles.badge, STATUS_BADGE_STYLES[request.status]]}>
            <Text style={styles.badgeLabel}>{request.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {request.description ? (
          <Text style={styles.description}>{request.description}</Text>
        ) : null}

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            {assigneeLabel ? `Claimed by ${assigneeLabel}` : 'Unclaimed'}
          </Text>
          <Text style={styles.detailText}>
            {request.appointmentEventId ? 'Appointment scheduled' : 'No appointment'}
          </Text>
          {costLabel ? <Text style={styles.detailText}>{costLabel}</Text> : null}
        </View>

        {request.latestNote ? (
          <Text style={styles.note}>Latest note: {request.latestNote}</Text>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        {nextStatus ? (
          <Button label={getMaintenanceStatusActionLabel(request.status)} onPress={onAdvanceStatus} />
        ) : (
          <Button label="Resolved" disabled />
        )}
        <Button label="Appointment" variant="secondary" onPress={onScheduleAppointment} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary.light,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary.light,
  },
  detailsRow: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary.light,
  },
  note: {
    fontSize: 13,
    color: colors.textPrimary.light,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.secondary.light,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary.light,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
