import React, { useEffect, useMemo, useState } from 'react';
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
import { colors } from '@/constants/theme';
import { buildRecurrenceRule, parseRecurrenceRule } from '@/lib/recurrence';

type RecurrencePreset = 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface ChoreEditorValues {
  title: string;
  description: string;
  area: string;
  estimatedMinutes: number;
  kind: 'responsibility' | 'bonus';
  assignedMemberIds: string[];
  recurrenceRule: string | null;
  recurrenceTimezone: string;
  recurrenceAnchor: string;
  nextOccurrenceAt: string | null;
}

interface ChoreEditorSheetProps {
  visible: boolean;
  members: Array<{ id: string; name: string }>;
  defaultAnchor: string;
  initialValues?: Partial<ChoreEditorValues>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: ChoreEditorValues) => Promise<void> | void;
}

const PRESETS: Array<{ key: RecurrencePreset; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Biweekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom interval' },
];

const WEEKDAY_OPTIONS = [
  { label: 'Mon', value: 'MO' },
  { label: 'Tue', value: 'TU' },
  { label: 'Wed', value: 'WE' },
  { label: 'Thu', value: 'TH' },
  { label: 'Fri', value: 'FR' },
  { label: 'Sat', value: 'SA' },
  { label: 'Sun', value: 'SU' },
] as const;

function getInitialRecurrence(initialValues: Partial<ChoreEditorValues> | undefined, defaultAnchor: string) {
  const anchor = initialValues?.recurrenceAnchor ?? initialValues?.nextOccurrenceAt ?? defaultAnchor;
  const timezone = initialValues?.recurrenceTimezone ?? 'UTC';
  const parsed = initialValues?.recurrenceRule ? parseRecurrenceRule(initialValues.recurrenceRule, timezone) : null;

  if (!parsed) {
    return {
      preset: 'weekly' as RecurrencePreset,
      weekday: 'MO',
      customInterval: '10',
      monthDay: String(new Date(anchor).getUTCDate()),
      timezone,
      anchor,
    };
  }

  if (parsed.frequency === 'daily' && parsed.interval === 1) {
    return {
      preset: 'daily' as RecurrencePreset,
      weekday: parsed.byWeekday[0] ?? 'MO',
      customInterval: '10',
      monthDay: String(new Date(anchor).getUTCDate()),
      timezone,
      anchor,
    };
  }

  if (parsed.frequency === 'daily' && parsed.interval > 1) {
    return {
      preset: 'custom' as RecurrencePreset,
      weekday: 'MO',
      customInterval: String(parsed.interval),
      monthDay: String(new Date(anchor).getUTCDate()),
      timezone,
      anchor,
    };
  }

  if (
    parsed.frequency === 'weekly'
    && parsed.interval === 1
    && parsed.byWeekday.join(',') === 'MO,TU,WE,TH,FR'
  ) {
    return {
      preset: 'weekdays' as RecurrencePreset,
      weekday: 'MO',
      customInterval: '10',
      monthDay: String(new Date(anchor).getUTCDate()),
      timezone,
      anchor,
    };
  }

  if (parsed.frequency === 'weekly') {
    return {
      preset: parsed.interval === 2 ? 'biweekly' as RecurrencePreset : 'weekly' as RecurrencePreset,
      weekday: parsed.byWeekday[0] ?? 'MO',
      customInterval: '10',
      monthDay: String(new Date(anchor).getUTCDate()),
      timezone,
      anchor,
    };
  }

  return {
    preset: 'monthly' as RecurrencePreset,
    weekday: 'MO',
    customInterval: '10',
    monthDay: String(parsed.byMonthDay[0] ?? new Date(anchor).getUTCDate()),
    timezone,
    anchor,
  };
}

export function ChoreEditorSheet({
  visible,
  members,
  defaultAnchor,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: ChoreEditorSheetProps) {
  const recurrenceDefaults = useMemo(
    () => getInitialRecurrence(initialValues, defaultAnchor),
    [defaultAnchor, initialValues]
  );
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [area, setArea] = useState(initialValues?.area ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(String(initialValues?.estimatedMinutes ?? 20));
  const [kind, setKind] = useState<'responsibility' | 'bonus'>(initialValues?.kind ?? 'responsibility');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>(initialValues?.assignedMemberIds ?? []);
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>(recurrenceDefaults.preset);
  const [weekday, setWeekday] = useState(recurrenceDefaults.weekday);
  const [customInterval, setCustomInterval] = useState(recurrenceDefaults.customInterval);
  const [monthDay, setMonthDay] = useState(recurrenceDefaults.monthDay);

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setArea(initialValues?.area ?? '');
    setEstimatedMinutes(String(initialValues?.estimatedMinutes ?? 20));
    setKind(initialValues?.kind ?? 'responsibility');
    setAssignedMemberIds(initialValues?.assignedMemberIds ?? []);
    setRecurrencePreset(recurrenceDefaults.preset);
    setWeekday(recurrenceDefaults.weekday);
    setCustomInterval(recurrenceDefaults.customInterval);
    setMonthDay(recurrenceDefaults.monthDay);
  }, [initialValues, recurrenceDefaults]);

  function toggleAssignment(memberId: string) {
    setAssignedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((value) => value !== memberId)
        : [...current, memberId]
    );
  }

  function buildRule() {
    const recurrenceAnchor = recurrenceDefaults.anchor;
    const recurrenceTimezone = recurrenceDefaults.timezone;

    if (recurrencePreset === 'daily') {
      return buildRecurrenceRule({
        frequency: 'daily',
        startsAt: recurrenceAnchor,
        timezone: recurrenceTimezone,
      });
    }

    if (recurrencePreset === 'weekdays') {
      return buildRecurrenceRule({
        frequency: 'weekly',
        byWeekday: ['MO', 'TU', 'WE', 'TH', 'FR'],
        startsAt: recurrenceAnchor,
        timezone: recurrenceTimezone,
      });
    }

    if (recurrencePreset === 'weekly' || recurrencePreset === 'biweekly') {
      return buildRecurrenceRule({
        frequency: 'weekly',
        interval: recurrencePreset === 'biweekly' ? 2 : 1,
        byWeekday: [weekday],
        startsAt: recurrenceAnchor,
        timezone: recurrenceTimezone,
      });
    }

    if (recurrencePreset === 'monthly') {
      return buildRecurrenceRule({
        frequency: 'monthly',
        byMonthDay: [Math.max(1, Math.min(31, Number(monthDay) || 1))],
        startsAt: recurrenceAnchor,
        timezone: recurrenceTimezone,
      });
    }

    return buildRecurrenceRule({
      frequency: 'daily',
      interval: Math.max(1, Number(customInterval) || 1),
      startsAt: recurrenceAnchor,
      timezone: recurrenceTimezone,
    });
  }

  async function handleSubmit() {
    const recurrence = buildRule();

    await onSubmit({
      title,
      description,
      area,
      estimatedMinutes: Math.max(1, Number(estimatedMinutes) || 15),
      kind,
      assignedMemberIds,
      recurrenceRule: recurrence.rule,
      recurrenceTimezone: recurrence.timezone,
      recurrenceAnchor: recurrence.startsAt,
      nextOccurrenceAt: recurrence.startsAt,
    });
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>
              {initialValues?.title ? 'Edit chore' : 'New chore'}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                testID="editor-title-input"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Kitchen reset"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="What good looks like"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Estimated minutes</Text>
                <TextInput
                  testID="editor-estimated-minutes-input"
                  style={styles.input}
                  value={estimatedMinutes}
                  onChangeText={setEstimatedMinutes}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Area</Text>
                <TextInput
                  testID="editor-area-input"
                  style={styles.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Kitchen"
                  placeholderTextColor={colors.textSecondary.light}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.choiceRow}>
                {(['responsibility', 'bonus'] as const).map((value) => {
                  const active = kind === value;

                  return (
                    <Pressable
                      key={value}
                      testID={`editor-kind-${value}`}
                      onPress={() => setKind(value)}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Assign to</Text>
              <View style={styles.choiceWrap}>
                {members.map((member) => {
                  const active = assignedMemberIds.includes(member.id);

                  return (
                    <Pressable
                      key={member.id}
                      testID={`editor-member-${member.id}`}
                      onPress={() => toggleAssignment(member.id)}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                        {member.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Recurrence</Text>
              <View style={styles.choiceWrap}>
                {PRESETS.map((preset) => {
                  const active = recurrencePreset === preset.key;

                  return (
                    <Pressable
                      key={preset.key}
                      testID={`editor-recurrence-${preset.key}`}
                      onPress={() => setRecurrencePreset(preset.key)}
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

            {(recurrencePreset === 'weekly' || recurrencePreset === 'biweekly') ? (
              <View style={styles.field}>
                <Text style={styles.label}>Day</Text>
                <View style={styles.choiceWrap}>
                  {WEEKDAY_OPTIONS.map((option) => {
                    const active = weekday === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        testID={`editor-weekday-${option.value}`}
                        onPress={() => setWeekday(option.value)}
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

            {recurrencePreset === 'monthly' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Day of month</Text>
                <TextInput
                  style={styles.input}
                  value={monthDay}
                  onChangeText={setMonthDay}
                  keyboardType="number-pad"
                />
              </View>
            ) : null}

            {recurrencePreset === 'custom' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Every N days</Text>
                <TextInput
                  style={styles.input}
                  value={customInterval}
                  onChangeText={setCustomInterval}
                  keyboardType="number-pad"
                />
              </View>
            ) : null}

            <View style={styles.footer}>
              <Button label="Cancel" variant="ghost" onPress={onClose} />
              <Button
                label={initialValues?.title ? 'Save chore' : 'Create chore'}
                onPress={handleSubmit}
                loading={loading}
              />
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
    backgroundColor: 'rgba(26, 22, 18, 0.24)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.dominant.light,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.textPrimary.light,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textSecondary.light,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.secondary.light,
    fontSize: 15,
    color: colors.textPrimary.light,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    color: colors.textPrimary.light,
    textTransform: 'capitalize',
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
});
