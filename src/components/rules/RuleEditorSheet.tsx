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
import type { HouseRuleVersionInput } from '@/types/rules';

interface RuleEditorSheetProps {
  visible: boolean;
  loading?: boolean;
  initialValues?: Partial<HouseRuleVersionInput> | null;
  onClose: () => void;
  onSubmit: (values: HouseRuleVersionInput) => Promise<void> | void;
}

export function RuleEditorSheet({
  visible,
  loading = false,
  initialValues,
  onClose,
  onSubmit,
}: RuleEditorSheetProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [changeSummary, setChangeSummary] = useState(initialValues?.changeSummary ?? '');
  const [body, setBody] = useState(initialValues?.body ?? '');

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setChangeSummary(initialValues?.changeSummary ?? '');
    setBody(initialValues?.body ?? '');
  }, [initialValues]);

  if (!visible) {
    return null;
  }

  async function handleSubmit() {
    await onSubmit({
      title,
      body,
      changeSummary: changeSummary || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Publish rules update</Text>
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="Household expectations" />
            <Input label="Change summary" value={changeSummary} onChangeText={setChangeSummary} placeholder="What changed in this version?" />
            <View style={styles.field}>
              <Text style={styles.label}>Rules body</Text>
              <TextInput
                multiline
                value={body}
                onChangeText={setBody}
                placeholder={"1. Quiet hours begin at 10 PM\n2. Guest notices go on the calendar\n3. Shared spaces get cleaned after use"}
                placeholderTextColor={colors.textSecondary.light}
                style={[styles.input, styles.multiline]}
              />
            </View>
            <View style={styles.actions}>
              <Button label="Cancel" variant="secondary" onPress={onClose} />
              <Button label="Publish version" onPress={handleSubmit} loading={loading} />
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
    minHeight: 220,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
