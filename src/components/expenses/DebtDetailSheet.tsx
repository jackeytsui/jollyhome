import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { useSettlements } from '@/hooks/useSettlements';
import { PaymentAppLinks } from './PaymentAppLinks';
import { SettlementHistoryRow } from './SettlementHistoryRow';
import type { Balance } from '@/types/expenses';

interface DebtDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  debt: Balance | null;
  memberName: string;
  memberId: string;
  onSettled?: () => void;
}

function formatCurrency(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function centsFromDollarString(value: string): number {
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function DebtDetailSheet({
  visible,
  onClose,
  debt,
  memberName,
  memberId,
  onSettled,
}: DebtDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '90%'], []);

  const { settlements, paymentPrefs, loading, createSettlement, loadSettlements, loadPaymentPrefs } =
    useSettlements();

  const [showSettleForm, setShowSettleForm] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [settleSuccess, setSettleSuccess] = useState(false);
  const [showOriginalChain, setShowOriginalChain] = useState(false);

  // Full debt amount in dollars
  const fullAmountDollars = debt ? (Math.abs(debt.amount) / 100).toFixed(2) : '0.00';

  // Determine sign: positive amount = member owes us, negative = we owe member
  const youOwe = debt ? debt.amount < 0 : false;
  const debtColor = youOwe ? colors.destructive.light : colors.success.light;

  // Load data when visible
  useEffect(() => {
    if (visible && memberId) {
      loadSettlements(memberId);
      loadPaymentPrefs(memberId);
    }
  }, [visible, memberId, loadSettlements, loadPaymentPrefs]);

  // Control bottom sheet open/close
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      // Reset state on close
      setShowSettleForm(false);
      setAmountInput('');
      setSelectedApp(null);
      setSettleSuccess(false);
      setShowOriginalChain(false);
    }
  }, [visible]);

  const handleOpenSettleForm = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmountInput(fullAmountDollars);
    setShowSettleForm(true);
    setSettleSuccess(false);
  }, [fullAmountDollars]);

  const handleConfirmSettlement = useCallback(async () => {
    const amountCents = centsFromDollarString(amountInput);
    if (amountCents <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid settlement amount.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const success = await createSettlement(memberId, amountCents, selectedApp ?? undefined);
    if (success) {
      setSettleSuccess(true);
      onSettled?.();
    } else {
      Alert.alert('Error', 'Could not record settlement. Please try again.');
    }
  }, [amountInput, createSettlement, memberId, selectedApp, onSettled]);

  const handleSelectApp = useCallback((app: string) => {
    setSelectedApp(app);
  }, []);

  const toggleOriginalChain = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOriginalChain((prev) => !prev);
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {memberName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.memberName}>{memberName}</Text>
            {debt && (
              <Text style={[styles.debtAmount, { color: debtColor }]}>
                {youOwe ? 'You owe ' : 'Owes you '}{formatCurrency(debt.amount)}
              </Text>
            )}
          </View>
        </View>

        {/* Settle Up Section */}
        {!settleSuccess ? (
          <>
            {!showSettleForm ? (
              <Pressable style={styles.settleButton} onPress={handleOpenSettleForm}>
                <Text style={styles.settleButtonText}>Settle Up</Text>
              </Pressable>
            ) : (
              <View style={styles.settleForm}>
                <Text style={styles.settleFormLabel}>Amount to settle</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary.light}
                  accessibilityLabel="Settlement amount"
                />

                <Text style={styles.paymentAppsLabel}>Pay with</Text>
                <PaymentAppLinks
                  amountCents={centsFromDollarString(amountInput)}
                  note={`Settlement with ${memberName}`}
                  recipientPrefs={paymentPrefs}
                  onSelectApp={handleSelectApp}
                />

                {selectedApp && (
                  <Text style={styles.selectedAppText}>
                    Selected: {selectedApp}
                  </Text>
                )}

                <Pressable
                  style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                  onPress={handleConfirmSettlement}
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? 'Recording...' : 'Confirm Settlement'}
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Settled! Balance updated.</Text>
          </View>
        )}

        {/* Show original debt chain toggle */}
        {debt && (
          <Pressable style={styles.originalToggle} onPress={toggleOriginalChain}>
            <Text style={styles.originalToggleText}>
              {showOriginalChain ? 'Hide original' : 'Show original'}
            </Text>
            <Text style={styles.originalChevron}>{showOriginalChain ? '↑' : '↓'}</Text>
          </Pressable>
        )}

        {showOriginalChain && debt && (
          <View style={styles.originalChain}>
            <Text style={styles.originalChainText}>
              {memberName} owes {formatCurrency(debt.amount)} (simplified from original transactions)
            </Text>
            <View style={styles.savedChip}>
              <Text style={styles.savedChipText}>Saved 1 transfer</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Settlement History */}
        <Text style={styles.sectionTitle}>Settlement History</Text>
        {settlements.length === 0 ? (
          <Text style={styles.emptyHistory}>No past settlements with {memberName}.</Text>
        ) : (
          <View style={styles.historyList}>
            {settlements.map((settlement) => (
              <SettlementHistoryRow
                key={settlement.id}
                settlement={settlement}
                memberName={memberName}
              />
            ))}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.dominant.light,
  },
  sheetHandle: {
    backgroundColor: colors.border.light,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  debtAmount: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  settleButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  settleForm: {
    gap: 12,
  },
  settleFormLabel: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
    fontWeight: '500',
  },
  amountInput: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    minHeight: 52,
  },
  paymentAppsLabel: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
    fontWeight: '500',
  },
  selectedAppText: {
    fontSize: 12,
    color: colors.accent.light,
    lineHeight: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  confirmButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  successBanner: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success.light,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    color: colors.success.light,
    lineHeight: 20,
    fontWeight: '600',
  },
  originalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  originalToggleText: {
    fontSize: 14,
    color: colors.accent.light,
    lineHeight: 20,
    fontWeight: '500',
  },
  originalChevron: {
    fontSize: 12,
    color: colors.accent.light,
  },
  originalChain: {
    opacity: 0.6,
    gap: 8,
  },
  originalChainText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  savedChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.light,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savedChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  emptyHistory: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  historyList: {
    gap: 0,
  },
});
