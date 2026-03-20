import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

interface RemoveMemberDialogProps {
  visible: boolean;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveMemberDialog({
  visible,
  memberName,
  onConfirm,
  onCancel,
}: RemoveMemberDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Remove {memberName}?</Text>
          <Text style={styles.body}>
            This will remove {memberName} from the household. Their expense history will remain. Any outstanding balances will stay on record.
          </Text>
          <View style={styles.actions}>
            <View style={styles.cancelButton}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={onCancel}
              />
            </View>
            <View style={styles.confirmButton}>
              <Button
                label="Remove Member"
                variant="destructive"
                onPress={onConfirm}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.dominant.light,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
