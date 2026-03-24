import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

export interface CompleteChoreValues {
  note: string;
  actualMinutes: number | null;
  photoPath: string | null;
}

interface CompleteChoreSheetProps {
  visible: boolean;
  choreTitle: string;
  supplyPrompt?: string | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CompleteChoreValues) => Promise<void> | void;
}

export function CompleteChoreSheet({
  visible,
  choreTitle,
  supplyPrompt = null,
  loading = false,
  onClose,
  onSubmit,
}: CompleteChoreSheetProps) {
  const [note, setNote] = useState('');
  const [actualMinutes, setActualMinutes] = useState('');
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  if (!visible) {
    return null;
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoPath(result.assets[0]?.uri ?? null);
    }
  }

  async function handleSubmit() {
    await onSubmit({
      note,
      actualMinutes: actualMinutes.trim() ? Math.max(0, Number(actualMinutes) || 0) : null,
      photoPath,
    });

    setNote('');
    setActualMinutes('');
    setPhotoPath(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Complete chore</Text>
            <Text style={styles.subtitle}>
              Wrap up {choreTitle} with an optional note, optional actual minutes, and optional photo proof.
            </Text>
            {supplyPrompt ? (
              <Text style={styles.promptText}>{supplyPrompt}</Text>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Completion note</Text>
              <TextInput
                testID="complete-note-input"
                style={[styles.input, styles.multilineInput]}
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Anything the next person should know"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Actual minutes</Text>
              <TextInput
                testID="complete-actual-minutes-input"
                style={styles.input}
                value={actualMinutes}
                onChangeText={setActualMinutes}
                keyboardType="number-pad"
                placeholder="Optional"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Optional photo proof</Text>
              <View style={styles.photoRow}>
                <Button label="Add photo proof" variant="secondary" onPress={handlePickPhoto} />
                {photoPath ? (
                  <Text style={styles.photoPath}>{photoPath}</Text>
                ) : (
                  <Text style={styles.photoHint}>No photo attached</Text>
                )}
              </View>
            </View>

            <View style={styles.footer}>
              <Button label="Cancel" variant="ghost" onPress={onClose} />
              <Button label="Mark complete" onPress={handleSubmit} loading={loading} />
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
    maxHeight: '80%',
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.sandbox.light,
    fontWeight: '600',
  },
  field: {
    gap: 8,
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
  photoRow: {
    gap: 10,
  },
  photoHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  photoPath: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
