import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { PendingRuleAcknowledgement } from '@/types/rules';

interface RuleAcknowledgementSheetProps {
  visible: boolean;
  acknowledgedCount: number;
  pending: PendingRuleAcknowledgement[];
  loading?: boolean;
  onClose: () => void;
  onAcknowledge: () => Promise<void> | void;
}

export function RuleAcknowledgementSheet({
  visible,
  acknowledgedCount,
  pending,
  loading = false,
  onClose,
  onAcknowledge,
}: RuleAcknowledgementSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Acknowledge current rules</Text>
            <Text style={styles.supporting}>
              {acknowledgedCount} household members have acknowledged this version so far.
            </Text>
            <Card style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>Still pending</Text>
              {pending.length > 0 ? (
                pending.map((member) => (
                  <Text key={member.memberId} style={styles.pendingItem}>{member.memberName}</Text>
                ))
              ) : (
                <Text style={styles.pendingItem}>Everyone is up to date.</Text>
              )}
            </Card>
            <View style={styles.actions}>
              <Button label="Close" variant="secondary" onPress={onClose} />
              <Button label="Acknowledge version" onPress={onAcknowledge} loading={loading} />
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
    maxHeight: '75%',
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
  supporting: {
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  pendingCard: {
    gap: 8,
  },
  pendingTitle: {
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  pendingItem: {
    color: colors.textPrimary.light,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
