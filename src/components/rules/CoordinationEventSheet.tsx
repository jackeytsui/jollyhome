import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import type { CoordinationActivityType, CoordinationEventInput } from '@/types/rules';

interface CoordinationEventSheetProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: CoordinationEventInput) => Promise<void> | void;
}

const TYPE_OPTIONS: Array<{ value: CoordinationActivityType; label: string }> = [
  { value: 'quiet_hours', label: 'Quiet hours' },
  { value: 'guest', label: 'Guest notice' },
  { value: 'booking', label: 'Booking' },
];

function nextHour() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
}

function twoHoursAfter(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function CoordinationEventSheet({
  visible,
  loading = false,
  onClose,
  onSubmit,
}: CoordinationEventSheetProps) {
  const [activityType, setActivityType] = useState<CoordinationActivityType>('quiet_hours');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState(nextHour());
  const [endsAt, setEndsAt] = useState(twoHoursAfter(nextHour()));

  useEffect(() => {
    if (!visible) {
      return;
    }

    const start = nextHour();
    setActivityType('quiet_hours');
    setTitle('');
    setDescription('');
    setLocation('');
    setStartsAt(start);
    setEndsAt(twoHoursAfter(start));
  }, [visible]);

  if (!visible) {
    return null;
  }

  async function handleSubmit() {
    const fallbackTitle =
      activityType === 'quiet_hours'
        ? 'Quiet hours'
        : activityType === 'guest'
        ? 'Guest notice'
        : 'Shared space booking';

    await onSubmit({
      activityType,
      title: title.trim() || fallbackTitle,
      description: description || null,
      location: location || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>New coordination event</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setActivityType(option.value)}
                  style={[styles.typeChip, activityType === option.value && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipLabel, activityType === option.value && styles.typeChipLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="Guest staying Friday night" />
            <Input label="Starts at" value={startsAt} onChangeText={setStartsAt} autoCapitalize="none" />
            <Input label="Ends at" value={endsAt} onChangeText={setEndsAt} autoCapitalize="none" />
            <Input label="Location" value={location} onChangeText={setLocation} placeholder="Guest room" />
            <Input label="Details" value={description} onChangeText={setDescription} placeholder="Sleeping arrangement, noise note, or booking details" />
            <View style={styles.actions}>
              <Button label="Cancel" variant="secondary" onPress={onClose} />
              <Button label="Save to calendar" onPress={handleSubmit} loading={loading} />
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
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipActive: {
    borderColor: colors.accent.light,
    backgroundColor: '#FFEDD5',
  },
  typeChipLabel: {
    color: colors.textSecondary.light,
    fontWeight: '600',
  },
  typeChipLabelActive: {
    color: colors.accent.light,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
