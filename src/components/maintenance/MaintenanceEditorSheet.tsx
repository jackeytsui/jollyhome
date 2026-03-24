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
import type { MaintenancePriority, MaintenanceRequestInput } from '@/types/maintenance';

interface MaintenanceEditorSheetProps {
  visible: boolean;
  initialValues?: Partial<MaintenanceRequestInput> | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: MaintenanceRequestInput) => Promise<void> | void;
}

const PRIORITY_OPTIONS: MaintenancePriority[] = ['low', 'medium', 'high', 'urgent'];

export function MaintenanceEditorSheet({
  visible,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: MaintenanceEditorSheetProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [area, setArea] = useState(initialValues?.area ?? '');
  const [priority, setPriority] = useState<MaintenancePriority>(initialValues?.priority ?? 'medium');
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [photoPath, setPhotoPath] = useState(initialValues?.photoPath ?? '');
  const [cost, setCost] = useState(initialValues?.costCents ? String(initialValues.costCents / 100) : '');

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setArea(initialValues?.area ?? '');
    setPriority(initialValues?.priority ?? 'medium');
    setNote(initialValues?.note ?? '');
    setPhotoPath(initialValues?.photoPath ?? '');
    setCost(initialValues?.costCents ? String(initialValues.costCents / 100) : '');
  }, [initialValues]);

  if (!visible) {
    return null;
  }

  async function handleSubmit() {
    await onSubmit({
      title,
      description: description || null,
      area: area || null,
      priority,
      note: note || null,
      photoPath: photoPath || null,
      costCents: cost ? Math.round(Number(cost) * 100) : null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{initialValues?.title ? 'Edit maintenance' : 'New maintenance request'}</Text>

            <Input label="Title" value={title} onChangeText={setTitle} placeholder="Leak under kitchen sink" />
            <Input label="Area" value={area} onChangeText={setArea} placeholder="Kitchen" />

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                multiline
                value={description}
                onChangeText={setDescription}
                placeholder="What happened, what needs attention, and any constraints"
                placeholderTextColor={colors.textSecondary.light}
                style={[styles.input, styles.multiline]}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.chips}>
                {PRIORITY_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setPriority(option)}
                    style={[
                      styles.chip,
                      priority === option && styles.chipActive,
                    ]}
                  >
                    <Text style={[
                      styles.chipLabel,
                      priority === option && styles.chipLabelActive,
                    ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input label="Latest note" value={note} onChangeText={setNote} placeholder="Called plumber, waiting for parts" />
            <Input label="Photo path" value={photoPath} onChangeText={setPhotoPath} placeholder="maintenance/house-1/sink.jpg" autoCapitalize="none" />
            <Input label="Cost so far" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" autoCapitalize="none" />

            <View style={styles.actions}>
              <Button label="Cancel" variant="secondary" onPress={onClose} />
              <Button label={initialValues?.title ? 'Save changes' : 'Create request'} onPress={handleSubmit} loading={loading} />
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
    minHeight: 110,
    textAlignVertical: 'top',
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
    textTransform: 'capitalize',
    color: colors.textSecondary.light,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.accent.light,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
