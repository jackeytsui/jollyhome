import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MaintenanceEditorSheet } from '@/components/maintenance/MaintenanceEditorSheet';
import { MaintenanceHistorySheet } from '@/components/maintenance/MaintenanceHistorySheet';
import { MaintenanceRequestCard } from '@/components/maintenance/MaintenanceRequestCard';
import { MaintenanceStatusSheet } from '@/components/maintenance/MaintenanceStatusSheet';
import { colors } from '@/constants/theme';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useMembers } from '@/hooks/useMembers';
import type { MaintenanceRequest, MaintenanceRequestInput } from '@/types/maintenance';
import { useHouseholdStore } from '@/stores/household';

export function buildMaintenanceSummary(activeCount: number, historyCount: number) {
  return {
    activeCount,
    historyCount,
    headline: activeCount > 0 ? `${activeCount} active requests` : 'No active maintenance work',
    supporting: historyCount > 0
      ? `${historyCount} resolved items still searchable`
      : 'History will build as requests are resolved',
  };
}

export default function MaintenanceScreen() {
  const [editorVisible, setEditorVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const {
    activeRequests,
    historyRequests,
    loading,
    error,
    createRequest,
    updateRequest,
    updateStatus,
    scheduleAppointment,
  } = useMaintenance();
  const { members, loadMembers } = useMembers(activeHouseholdId);

  useEffect(() => {
    if (activeHouseholdId) {
      loadMembers();
    }
  }, [activeHouseholdId, loadMembers]);

  const memberNameMap = useMemo(
    () => new Map(members.map((member) => [member.user_id, member.profile.display_name ?? 'Housemate'])),
    [members]
  );

  const summary = useMemo(
    () => buildMaintenanceSummary(activeRequests.length, historyRequests.length),
    [activeRequests.length, historyRequests.length]
  );

  async function handleSubmit(values: MaintenanceRequestInput) {
    setSubmitting(true);

    try {
      if (editingRequest) {
        await updateRequest(editingRequest.id, values);
      } else {
        await createRequest(values);
      }

      setEditorVisible(false);
      setEditingRequest(null);
    } catch (submitError) {
      Alert.alert('Maintenance', submitError instanceof Error ? submitError.message : 'Failed to save request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdvanceStatus(input: {
    status: MaintenanceRequest['status'];
    note?: string | null;
    costCents?: number | null;
    photoPath?: string | null;
  }) {
    if (!selectedRequest) {
      return;
    }

    setSubmitting(true);

    try {
      await updateStatus(selectedRequest.id, input);
      setStatusVisible(false);
      setSelectedRequest(null);
    } catch (submitError) {
      Alert.alert('Maintenance', submitError instanceof Error ? submitError.message : 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleScheduleAppointment(input: {
    startsAt: string;
    endsAt: string;
    location?: string | null;
    description?: string | null;
    ownerMemberUserIds?: string[];
  }) {
    if (!selectedRequest) {
      return;
    }

    setSubmitting(true);

    try {
      await scheduleAppointment(selectedRequest.id, input);
      setStatusVisible(false);
      setSelectedRequest(null);
    } catch (submitError) {
      Alert.alert('Maintenance', submitError instanceof Error ? submitError.message : 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.hero}>
          <Text style={styles.eyebrow}>Household maintenance</Text>
          <Text style={styles.headline}>{summary.headline}</Text>
          <Text style={styles.supporting}>{summary.supporting}</Text>
          <View style={styles.heroActions}>
            <Button
              label="New request"
              onPress={() => {
                setEditingRequest(null);
                setEditorVisible(true);
              }}
            />
            <Button label="History" variant="secondary" onPress={() => setHistoryVisible(true)} />
          </View>
        </Card>

        {error ? (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active queue</Text>
            <Text style={styles.sectionMeta}>{loading ? 'Loading...' : `${activeRequests.length} items`}</Text>
          </View>

          {activeRequests.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>Nothing active right now</Text>
              <Text style={styles.emptyBody}>Create a request when something breaks, needs scheduling, or should stay visible to the whole household.</Text>
            </Card>
          ) : (
            activeRequests.map((request) => (
              <MaintenanceRequestCard
                key={request.id}
                request={request}
                assigneeLabel={request.claimedBy ? memberNameMap.get(request.claimedBy) ?? 'Housemate' : null}
                onEdit={() => {
                  setEditingRequest(request);
                  setEditorVisible(true);
                }}
                onAdvanceStatus={() => {
                  setSelectedRequest(request);
                  setStatusVisible(true);
                }}
                onScheduleAppointment={() => {
                  setSelectedRequest(request);
                  setStatusVisible(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <MaintenanceEditorSheet
        visible={editorVisible}
        initialValues={editingRequest ? {
          title: editingRequest.title,
          description: editingRequest.description,
          area: editingRequest.area,
          priority: editingRequest.priority,
          note: editingRequest.latestNote,
          photoPath: editingRequest.latestPhotoPath,
          costCents: editingRequest.costCents,
        } : null}
        loading={submitting}
        onClose={() => {
          setEditorVisible(false);
          setEditingRequest(null);
        }}
        onSubmit={handleSubmit}
      />

      <MaintenanceStatusSheet
        visible={statusVisible}
        request={selectedRequest}
        loading={submitting}
        onClose={() => {
          setStatusVisible(false);
          setSelectedRequest(null);
        }}
        onAdvanceStatus={handleAdvanceStatus}
        onScheduleAppointment={handleScheduleAppointment}
      />

      <MaintenanceHistorySheet
        visible={historyVisible}
        requests={historyRequests}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.accent.light,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary.light,
  },
  supporting: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  sectionMeta: {
    fontSize: 13,
    color: colors.textSecondary.light,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  errorText: {
    color: colors.destructive.light,
  },
});
