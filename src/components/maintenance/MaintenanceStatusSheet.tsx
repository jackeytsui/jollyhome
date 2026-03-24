import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { getNextMaintenanceStatus } from '@/hooks/useMaintenance';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceStatusSheetProps {
  visible: boolean;
  request: MaintenanceRequest | null;
  loading?: boolean;
  onClose: () => void;
  onAdvanceStatus: (input: { status: MaintenanceRequest['status']; note?: string | null; costCents?: number | null; photoPath?: string | null; }) => Promise<void> | void;
  onScheduleAppointment: (input: { startsAt: string; endsAt: string; location?: string | null; description?: string | null; ownerMemberUserIds?: string[]; }) => Promise<void> | void;
}

function addOneHour(value: string) {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function MaintenanceStatusSheet({
  visible,
  request,
  loading = false,
  onClose,
  onAdvanceStatus,
  onScheduleAppointment,
}: MaintenanceStatusSheetProps) {
  const [note, setNote] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [cost, setCost] = useState('');
  const [appointmentStartsAt, setAppointmentStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [appointmentEndsAt, setAppointmentEndsAt] = useState(addOneHour(new Date().toISOString()));
  const [location, setLocation] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');

  useEffect(() => {
    setNote(request?.latestNote ?? '');
    setPhotoPath(request?.latestPhotoPath ?? '');
    setCost(request?.costCents ? String(request.costCents / 100) : '');
    const start = new Date().toISOString().slice(0, 16);
    setAppointmentStartsAt(start);
    setAppointmentEndsAt(addOneHour(start));
    setLocation('');
    setAppointmentDescription(request?.description ?? '');
  }, [request]);

  if (!visible || !request) {
    return null;
  }

  const nextStatus = getNextMaintenanceStatus(request.status);

  async function handleAdvance() {
    if (!nextStatus) {
      return;
    }

    await onAdvanceStatus({
      status: nextStatus,
      note: note || null,
      costCents: cost ? Math.round(Number(cost) * 100) : null,
      photoPath: photoPath || null,
    });
  }

  async function handleSchedule() {
    await onScheduleAppointment({
      startsAt: new Date(appointmentStartsAt).toISOString(),
      endsAt: new Date(appointmentEndsAt).toISOString(),
      location: location || null,
      description: appointmentDescription || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{request.title}</Text>
            <Text style={styles.subtitle}>Move the request forward or schedule a calendar-visible appointment.</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status update</Text>
              <Input label="Latest note" value={note} onChangeText={setNote} placeholder="What changed?" />
              <Input label="Photo path" value={photoPath} onChangeText={setPhotoPath} placeholder="maintenance/house-1/follow-up.jpg" autoCapitalize="none" />
              <Input label="Cost so far" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" autoCapitalize="none" />
              <Button label={nextStatus ? `Move to ${nextStatus.replace('_', ' ')}` : 'Resolved'} onPress={handleAdvance} disabled={!nextStatus} loading={loading} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appointment</Text>
              <Input label="Starts at" value={appointmentStartsAt} onChangeText={setAppointmentStartsAt} placeholder="2026-03-25T09:00" autoCapitalize="none" />
              <Input label="Ends at" value={appointmentEndsAt} onChangeText={setAppointmentEndsAt} placeholder="2026-03-25T10:00" autoCapitalize="none" />
              <Input label="Location" value={location} onChangeText={setLocation} placeholder="Laundry room" />
              <View style={styles.field}>
                <Text style={styles.label}>Appointment note</Text>
                <TextInput
                  multiline
                  value={appointmentDescription}
                  onChangeText={setAppointmentDescription}
                  placeholder="Vendor arrival window or access instructions"
                  placeholderTextColor={colors.textSecondary.light}
                  style={[styles.input, styles.multiline]}
                />
              </View>
              <Button label="Schedule appointment" variant="secondary" onPress={handleSchedule} loading={loading} />
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
    maxHeight: '88%',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  subtitle: {
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    color: colors.textPrimary.light,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
