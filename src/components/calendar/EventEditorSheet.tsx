import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarActivityType, CalendarEvent } from '@/types/calendar';

export interface ActivityTypeOption {
  label: string;
  value: CalendarActivityType;
}

export interface MemberOption {
  id: string;
  label: string;
  color: string;
}

export const ACTIVITY_TYPE_OPTIONS: ActivityTypeOption[] = [
  { label: 'Event', value: 'event' },
  { label: 'Meal', value: 'meal' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Guest', value: 'guest' },
  { label: 'Quiet hours', value: 'quiet_hours' },
  { label: 'Booking', value: 'booking' },
];

interface EventEditorSheetProps {
  visible: boolean;
  mode?: 'create' | 'edit';
  event?: CalendarEvent | null;
  memberOptions?: MemberOption[];
  onClose: () => void;
  onSaved?: () => void;
}

interface EventEditorFormState {
  activityType: CalendarActivityType;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  recurrenceRule: string;
  selectedMemberId: string | null;
}

function createDefaultFormState(memberOptions: MemberOption[]): EventEditorFormState {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    activityType: 'event',
    title: '',
    startsAt: start.toISOString().slice(0, 16),
    endsAt: end.toISOString().slice(0, 16),
    location: '',
    description: '',
    recurrenceRule: '',
    selectedMemberId: memberOptions[0]?.id ?? null,
  };
}

function mapEventToFormState(event: CalendarEvent, memberOptions: MemberOption[]): EventEditorFormState {
  return {
    activityType: event.activityType,
    title: event.title,
    startsAt: event.startsAt.slice(0, 16),
    endsAt: event.endsAt.slice(0, 16),
    location: event.location ?? '',
    description: event.description ?? '',
    recurrenceRule: event.recurrenceRule ?? '',
    selectedMemberId: event.memberOwnerIds[0] ?? memberOptions[0]?.id ?? null,
  };
}

function toIsoDateTime(value: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}

export function EventEditorSheet({
  visible,
  mode = 'create',
  event = null,
  memberOptions = [],
  onClose,
  onSaved,
}: EventEditorSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['82%', '96%'], []);
  const { createEvent, updateEvent } = useCalendar();
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<EventEditorFormState>(
    createDefaultFormState(memberOptions)
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      setFormState(
        event ? mapEventToFormState(event, memberOptions) : createDefaultFormState(memberOptions)
      );
    } else {
      bottomSheetRef.current?.close();
    }
  }, [event, memberOptions, visible]);

  function updateField<Key extends keyof EventEditorFormState>(
    field: Key,
    value: EventEditorFormState[Key]
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    if (!formState.title.trim()) {
      Alert.alert('Missing title', 'Add a title before saving the event.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        activity_type: formState.activityType,
        title: formState.title.trim(),
        starts_at: toIsoDateTime(formState.startsAt),
        ends_at: toIsoDateTime(formState.endsAt),
        location: formState.location.trim() || null,
        description: formState.description.trim() || null,
        recurrence_rule: formState.recurrenceRule.trim() || null,
        recurrence_anchor: toIsoDateTime(formState.startsAt),
        owner_member_user_ids: formState.selectedMemberId ? [formState.selectedMemberId] : [],
      };

      if (mode === 'edit' && event) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
      }

      onSaved?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save event';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'edit' ? 'Edit event' : 'Create event'}
          </Text>
          <Text style={styles.caption}>
            Household events, meals, maintenance, guests, quiet hours, and bookings all start here.
          </Text>
        </View>

        <Input
          label="Title"
          value={formState.title}
          onChangeText={(value) => updateField('title', value)}
          placeholder="Sunday dinner"
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Activity type</Text>
          <View style={styles.optionRow}>
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <View key={option.value} style={styles.optionButton}>
                <Button
                  label={option.label}
                  variant={formState.activityType === option.value ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => updateField('activityType', option.value)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.twoUp}>
          <View style={styles.half}>
            <Input
              label="Start date/time"
              value={formState.startsAt}
              onChangeText={(value) => updateField('startsAt', value)}
              placeholder="2026-03-23T18:00"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.half}>
            <Input
              label="End date/time"
              value={formState.endsAt}
              onChangeText={(value) => updateField('endsAt', value)}
              placeholder="2026-03-23T19:00"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Input
          label="Location"
          value={formState.location}
          onChangeText={(value) => updateField('location', value)}
          placeholder="Kitchen"
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            multiline
            numberOfLines={4}
            value={formState.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Add details for the household."
            placeholderTextColor={colors.textSecondary.light}
            style={[styles.textArea, styles.inputChrome]}
          />
        </View>

        <Input
          label="Recurrence rule"
          value={formState.recurrenceRule}
          onChangeText={(value) => updateField('recurrenceRule', value)}
          placeholder="RRULE:FREQ=WEEKLY;BYDAY=MO"
          autoCapitalize="none"
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Member color association</Text>
          <View style={styles.optionRow}>
            {memberOptions.map((member) => (
              <View key={member.id} style={styles.memberOption}>
                <Button
                  label={member.label}
                  variant={formState.selectedMemberId === member.id ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => updateField('selectedMemberId', member.id)}
                />
                <View style={[styles.memberSwatch, { backgroundColor: member.color }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button
            label={mode === 'edit' ? 'Save changes' : 'Create event'}
            loading={saving}
            onPress={() => {
              void handleSave();
            }}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.secondary.light,
  },
  handleIndicator: {
    backgroundColor: colors.border.light,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 28,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    minWidth: 110,
  },
  twoUp: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  inputChrome: {
    backgroundColor: colors.secondary.light,
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
    borderWidth: 1.5,
    borderColor: colors.border.light,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberSwatch: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
});
