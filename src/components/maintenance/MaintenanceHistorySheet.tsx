import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { filterMaintenanceHistory } from '@/hooks/useMaintenance';
import type { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '@/types/maintenance';

interface MaintenanceHistorySheetProps {
  visible: boolean;
  requests: MaintenanceRequest[];
  onClose: () => void;
}

const FILTER_VALUES = {
  priority: ['all', 'urgent', 'high', 'medium', 'low'] as const,
  status: ['all', 'resolved', 'in_progress', 'claimed', 'open'] as const,
};

export function MaintenanceHistorySheet({
  visible,
  requests,
  onClose,
}: MaintenanceHistorySheetProps) {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority | 'all'>('all');
  const [status, setStatus] = useState<MaintenanceStatus | 'all'>('all');

  const areaOptions = useMemo(
    () => ['all', ...new Set(requests.map((request) => request.area ?? 'Unassigned area'))],
    [requests]
  );
  const [area, setArea] = useState<string | 'all'>('all');

  const filtered = useMemo(
    () => filterMaintenanceHistory(requests, {
      query,
      priority,
      status,
      area,
    }),
    [area, priority, query, requests, status]
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Maintenance history</Text>
            <Input label="Search history" value={query} onChangeText={setQuery} placeholder="Search by title, note, or area" />

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Priority</Text>
              <View style={styles.chips}>
                {FILTER_VALUES.priority.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setPriority(value)}
                    style={[styles.chip, priority === value && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, priority === value && styles.chipLabelActive]}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.chips}>
                {FILTER_VALUES.status.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setStatus(value)}
                    style={[styles.chip, status === value && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, status === value && styles.chipLabelActive]}>
                      {value.replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Area</Text>
              <View style={styles.chips}>
                {areaOptions.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setArea(value)}
                    style={[styles.chip, area === value && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, area === value && styles.chipLabelActive]}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.list}>
              {filtered.map((request) => (
                <Card key={request.id} style={styles.requestCard}>
                  <Text style={styles.requestTitle}>{request.title}</Text>
                  <Text style={styles.requestMeta}>
                    {(request.area ?? 'Unassigned area')} · {request.priority} · {request.status.replace('_', ' ')}
                  </Text>
                  {request.latestNote ? <Text style={styles.requestNote}>{request.latestNote}</Text> : null}
                </Card>
              ))}
              {filtered.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No maintenance history matches those filters.</Text>
                </Card>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26, 22, 18, 0.36)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  filterBlock: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.secondary.light,
  },
  chipActive: {
    borderColor: colors.accent.light,
    backgroundColor: '#FFEDD5',
  },
  chipLabel: {
    color: colors.textSecondary.light,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipLabelActive: {
    color: colors.accent.light,
  },
  list: {
    gap: 12,
  },
  requestCard: {
    gap: 6,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  requestMeta: {
    fontSize: 13,
    color: colors.textSecondary.light,
    textTransform: 'capitalize',
  },
  requestNote: {
    fontSize: 14,
    color: colors.textPrimary.light,
  },
  emptyText: {
    color: colors.textSecondary.light,
  },
});
