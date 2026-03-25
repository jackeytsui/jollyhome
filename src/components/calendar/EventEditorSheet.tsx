import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
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
import { buildRecurrenceRule, parseRecurrenceRule, type RecurrenceFrequency, type RecurrenceWeekday } from '@/lib/recurrence';
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

type RecurrencePreset = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

const RECURRENCE_PRESETS: Array<{ key: RecurrencePreset; label: string }> = [
  { key: 'none', label: 'Does not repeat' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom' },
];

const CUSTOM_FREQUENCY_OPTIONS: Array<{ key: RecurrenceFrequency; label: string }> = [
  { key: 'daily', label: 'Days' },
  { key: 'weekly', label: 'Weeks' },
  { key: 'monthly', label: 'Months' },
  { key: 'yearly', label: 'Years' },
];

const WEEKDAY_OPTIONS: Array<{ value: RecurrenceWeekday; label: string }> = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
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
  recurrencePreset: RecurrencePreset;
  recurrenceWeekdays: RecurrenceWeekday[];
  recurrenceMonthDay: string;
  customInterval: string;
  customFrequency: RecurrenceFrequency;
  selectedMemberId: string | null;
}

interface BuiltRecurrenceState {
  recurrenceRule: string | null;
  recurrenceAnchor: string;
  recurrenceTimezone: string;
}

function getDefaultMonthDay(value: string): string {
  return String(new Date(value).getUTCDate());
}

function getTimezoneFromEvent(event: CalendarEvent | null): string {
  return event?.recurrenceTimezone ?? event?.timezone ?? 'UTC';
}

function createDefaultFormState(memberOptions: MemberOption[]): EventEditorFormState {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const startsAt = start.toISOString().slice(0, 16);

  return {
    activityType: 'event',
    title: '',
    startsAt,
    endsAt: end.toISOString().slice(0, 16),
    location: '',
    description: '',
    recurrencePreset: 'none',
    recurrenceWeekdays: ['MO'],
    recurrenceMonthDay: getDefaultMonthDay(startsAt),
    customInterval: '2',
    customFrequency: 'weekly',
    selectedMemberId: memberOptions[0]?.id ?? null,
  };
}

function mapEventToFormState(event: CalendarEvent, memberOptions: MemberOption[]): EventEditorFormState {
  const startsAt = event.startsAt.slice(0, 16);
  const timezone = getTimezoneFromEvent(event);
  const parsed = event.recurrenceRule ? parseRecurrenceRule(event.recurrenceRule, timezone) : null;

  const recurrenceState = (() => {
    if (!parsed) {
      return {
        preset: 'none' as RecurrencePreset,
        recurrenceWeekdays: ['MO'] as RecurrenceWeekday[],
        recurrenceMonthDay: getDefaultMonthDay(startsAt),
        customInterval: '2',
        customFrequency: 'weekly' as RecurrenceFrequency,
      };
    }

    if (parsed.frequency === 'daily' && parsed.interval === 1) {
      return {
        preset: 'daily' as RecurrencePreset,
        recurrenceWeekdays: ['MO'] as RecurrenceWeekday[],
        recurrenceMonthDay: getDefaultMonthDay(startsAt),
        customInterval: '2',
        customFrequency: 'weekly' as RecurrenceFrequency,
      };
    }

    if (parsed.frequency === 'weekly' && parsed.interval === 1) {
      return {
        preset: 'weekly' as RecurrencePreset,
        recurrenceWeekdays: parsed.byWeekday.length > 0 ? parsed.byWeekday : ['MO' as RecurrenceWeekday],
        recurrenceMonthDay: getDefaultMonthDay(startsAt),
        customInterval: '2',
        customFrequency: 'weekly' as RecurrenceFrequency,
      };
    }

    if (parsed.frequency === 'monthly' && parsed.interval === 1) {
      return {
        preset: 'monthly' as RecurrencePreset,
        recurrenceWeekdays: ['MO'] as RecurrenceWeekday[],
        recurrenceMonthDay: String(parsed.byMonthDay[0] ?? getDefaultMonthDay(startsAt)),
        customInterval: '2',
        customFrequency: 'monthly' as RecurrenceFrequency,
      };
    }

    return {
      preset: 'custom' as RecurrencePreset,
      recurrenceWeekdays: parsed.byWeekday.length > 0 ? parsed.byWeekday : ['MO' as RecurrenceWeekday],
      recurrenceMonthDay: String(parsed.byMonthDay[0] ?? getDefaultMonthDay(startsAt)),
      customInterval: String(parsed.interval),
      customFrequency: parsed.frequency,
    };
  })();

  return {
    activityType: event.activityType,
    title: event.title,
    startsAt,
    endsAt: event.endsAt.slice(0, 16),
    location: event.location ?? '',
    description: event.description ?? '',
    recurrencePreset: recurrenceState.preset,
    recurrenceWeekdays: recurrenceState.recurrenceWeekdays,
    recurrenceMonthDay: recurrenceState.recurrenceMonthDay,
    customInterval: recurrenceState.customInterval,
    customFrequency: recurrenceState.customFrequency,
    selectedMemberId: event.memberOwnerIds[0] ?? memberOptions[0]?.id ?? null,
  };
}

function toIsoDateTime(value: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}

function normalizeMonthDay(value: string, fallback: string): number {
  return Math.max(1, Math.min(31, Number(value) || Number(fallback) || 1));
}

function buildRecurrenceState(formState: EventEditorFormState, timezone: string): BuiltRecurrenceState {
  const recurrenceAnchor = toIsoDateTime(formState.startsAt);

  if (formState.recurrencePreset === 'none') {
    return {
      recurrenceRule: null,
      recurrenceAnchor,
      recurrenceTimezone: timezone,
    };
  }

  if (formState.recurrencePreset === 'daily') {
    const recurrence = buildRecurrenceRule({
      frequency: 'daily',
      startsAt: recurrenceAnchor,
      timezone,
    });

    return {
      recurrenceRule: recurrence.rule,
      recurrenceAnchor: recurrence.startsAt,
      recurrenceTimezone: recurrence.timezone,
    };
  }

  if (formState.recurrencePreset === 'weekly') {
    const recurrence = buildRecurrenceRule({
      frequency: 'weekly',
      byWeekday: formState.recurrenceWeekdays.length > 0 ? formState.recurrenceWeekdays : ['MO'],
      startsAt: recurrenceAnchor,
      timezone,
    });

    return {
      recurrenceRule: recurrence.rule,
      recurrenceAnchor: recurrence.startsAt,
      recurrenceTimezone: recurrence.timezone,
    };
  }

  if (formState.recurrencePreset === 'monthly') {
    const recurrence = buildRecurrenceRule({
      frequency: 'monthly',
      byMonthDay: [normalizeMonthDay(formState.recurrenceMonthDay, getDefaultMonthDay(formState.startsAt))],
      startsAt: recurrenceAnchor,
      timezone,
    });

    return {
      recurrenceRule: recurrence.rule,
      recurrenceAnchor: recurrence.startsAt,
      recurrenceTimezone: recurrence.timezone,
    };
  }

  const recurrence = buildRecurrenceRule({
    frequency: formState.customFrequency,
    interval: Math.max(1, Number(formState.customInterval) || 1),
    byWeekday: formState.customFrequency === 'weekly'
      ? (formState.recurrenceWeekdays.length > 0 ? formState.recurrenceWeekdays : ['MO'])
      : undefined,
    byMonthDay: formState.customFrequency === 'monthly'
      ? [normalizeMonthDay(formState.recurrenceMonthDay, getDefaultMonthDay(formState.startsAt))]
      : undefined,
    startsAt: recurrenceAnchor,
    timezone,
  });

  return {
    recurrenceRule: recurrence.rule,
    recurrenceAnchor: recurrence.startsAt,
    recurrenceTimezone: recurrence.timezone,
  };
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

  function toggleWeekday(weekday: RecurrenceWeekday) {
    setFormState((current) => {
      const hasWeekday = current.recurrenceWeekdays.includes(weekday);

      if (hasWeekday && current.recurrenceWeekdays.length === 1) {
        return current;
      }

      return {
        ...current,
        recurrenceWeekdays: hasWeekday
          ? current.recurrenceWeekdays.filter((value) => value !== weekday)
          : [...current.recurrenceWeekdays, weekday],
      };
    });
  }

  async function handleSave() {
    if (!formState.title.trim()) {
      Alert.alert('Missing title', 'Add a title before saving the event.');
      return;
    }

    setSaving(true);

    try {
      const { recurrenceRule, recurrenceAnchor, recurrenceTimezone } = buildRecurrenceState(
        formState,
        getTimezoneFromEvent(event)
      );
      const payload = {
        activity_type: formState.activityType,
        title: formState.title.trim(),
        starts_at: toIsoDateTime(formState.startsAt),
        ends_at: toIsoDateTime(formState.endsAt),
        location: formState.location.trim() || null,
        description: formState.description.trim() || null,
        recurrence_rule: recurrenceRule,
        recurrence_timezone: recurrenceTimezone,
        recurrence_anchor: recurrenceAnchor,
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recurrence</Text>
          <Text style={styles.sectionCaption}>
            Pick a pattern and the editor will store the RRULE for you.
          </Text>
          <View style={styles.chipWrap}>
            {RECURRENCE_PRESETS.map((preset) => {
              const active = formState.recurrencePreset === preset.key;

              return (
                <Pressable
                  key={preset.key}
                  onPress={() => updateField('recurrencePreset', preset.key)}
                  style={[styles.choiceChip, active && styles.choiceChipActive]}
                >
                  <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {(formState.recurrencePreset === 'weekly'
          || (formState.recurrencePreset === 'custom' && formState.customFrequency === 'weekly')) ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Weekday(s)</Text>
            <View style={styles.chipWrap}>
              {WEEKDAY_OPTIONS.map((option) => {
                const active = formState.recurrenceWeekdays.includes(option.value);

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleWeekday(option.value)}
                    style={[styles.choiceChip, active && styles.choiceChipActive]}
                  >
                    <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {(formState.recurrencePreset === 'monthly'
          || (formState.recurrencePreset === 'custom' && formState.customFrequency === 'monthly')) ? (
          <View style={styles.section}>
            <Input
              label="Day of month"
              value={formState.recurrenceMonthDay}
              onChangeText={(value) => updateField('recurrenceMonthDay', value)}
              keyboardType="number-pad"
            />
          </View>
        ) : null}

        {formState.recurrencePreset === 'custom' ? (
          <View style={styles.section}>
            <View style={styles.twoUp}>
              <View style={styles.half}>
                <Input
                  label="Repeat every"
                  value={formState.customInterval}
                  onChangeText={(value) => updateField('customInterval', value)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.sectionLabel}>Unit</Text>
                <View style={styles.chipWrap}>
                  {CUSTOM_FREQUENCY_OPTIONS.map((option) => {
                    const active = formState.customFrequency === option.key;

                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => updateField('customFrequency', option.key)}
                        style={[styles.choiceChip, active && styles.choiceChipActive]}
                      >
                        <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : null}

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
  sectionCaption: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipWrap: {
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
  choiceChip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary.light,
  },
  choiceChipActive: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  choiceText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textSecondary.light,
  },
  choiceTextActive: {
    color: colors.dominant.light,
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
