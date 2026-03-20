import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

interface LeaveHouseholdDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  hasOutstandingBalance?: boolean;
  balanceAmount?: string;
}

export function LeaveHouseholdDialog({
  visible,
  onConfirm,
  onCancel,
  hasOutstandingBalance = false,
  balanceAmount,
}: LeaveHouseholdDialogProps) {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Leave Household?</Text>
          <Text style={styles.body}>
            Are you sure you want to leave? Your expense history stays on record. Any outstanding balances will remain visible to other members.
          </Text>
          {hasOutstandingBalance && balanceAmount && (
            <Text style={styles.warning}>
              You have an outstanding balance of {balanceAmount}. This will remain on record.
            </Text>
          )}
          <View style={styles.actions}>
            <View style={styles.cancelButton}>
              <Button
                label="Never Mind"
                variant="secondary"
                onPress={onCancel}
              />
            </View>
            <View style={styles.confirmButton}>
              <Button
                label="Yes, Leave"
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
    marginBottom: 12,
  },
  warning: {
    fontSize: 14,
    color: colors.destructive.light,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
