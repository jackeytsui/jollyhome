import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { ItemClassificationTag } from './ItemClassificationTag';
import { SplitSummaryPreview } from './SplitSummaryPreview';
import { suggestCategory } from '@/lib/expenseMath';
import type { ReceiptData, ReceiptItem } from '@/hooks/useReceipt';
import type { Member } from '@/hooks/useMembers';
import type { CreateExpenseInput } from '@/types/expenses';

interface ReceiptReviewCardProps {
  receiptData: ReceiptData;
  members: Member[];
  currentUserId: string;
  householdId: string;
  onConfirm: (input: CreateExpenseInput) => void;
  onCancel: () => void;
  loading: boolean;
}

function formatCentsToString(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseCentsFromString(value: string): number {
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function ReceiptReviewCard({
  receiptData,
  members,
  currentUserId,
  householdId,
  onConfirm,
  onCancel,
  loading,
}: ReceiptReviewCardProps) {
  const [storeName, setStoreName] = useState(receiptData.store_name);
  const [date, setDate] = useState(receiptData.date ?? '');
  const [items, setItems] = useState<ReceiptItem[]>(receiptData.items);
  const [taxStr, setTaxStr] = useState(formatCentsToString(receiptData.tax_cents));
  const [tipStr, setTipStr] = useState(formatCentsToString(receiptData.tip_cents));
  const [totalStr, setTotalStr] = useState(formatCentsToString(receiptData.total_cents));

  const taxCents = parseCentsFromString(taxStr);
  const tipCents = parseCentsFromString(tipStr);

  // Computed total from items + tax + tip
  const computedItemTotal = items.reduce((sum, item) => sum + item.price_cents, 0);
  const computedTotal = computedItemTotal + taxCents + tipCents;
  const editedTotalCents = parseCentsFromString(totalStr);
  const totalMismatch = Math.abs(computedTotal - editedTotalCents) > 2; // allow 2 cent rounding tolerance

  const updateItemName = useCallback((index: number, name: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  }, []);

  const updateItemPrice = useCallback((index: number, priceStr: string) => {
    const price_cents = parseCentsFromString(priceStr);
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, price_cents } : item)));
  }, []);

  const updateItemClassification = useCallback(
    (index: number, classification: 'shared' | 'personal', ownerId: string | null) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, classification, suggested_owner: ownerId } : item
        )
      );
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Build per-member splits from classification
    const activeMembers = members.filter((m) => m.status === 'active');
    const memberCount = activeMembers.length || 1;

    // Compute per-member item totals
    const itemTotalsByUser: Record<string, number> = {};
    activeMembers.forEach((m) => { itemTotalsByUser[m.user_id] = 0; });

    const sharedItems = items.filter((item) => item.classification === 'shared');
    const personalItems = items.filter((item) => item.classification === 'personal');

    const sharedTotal = sharedItems.reduce((sum, item) => sum + item.price_cents, 0);
    const sharedPerPerson = Math.floor(sharedTotal / memberCount);
    const sharedRemainder = sharedTotal - sharedPerPerson * memberCount;

    activeMembers.forEach((member, index) => {
      itemTotalsByUser[member.user_id] =
        (itemTotalsByUser[member.user_id] ?? 0) + sharedPerPerson + (index < sharedRemainder ? 1 : 0);
    });

    personalItems.forEach((item) => {
      const ownerId = item.suggested_owner;
      if (ownerId && itemTotalsByUser[ownerId] !== undefined) {
        itemTotalsByUser[ownerId] += item.price_cents;
      } else {
        // Unassigned personal items split equally
        activeMembers.forEach((member, index) => {
          const perPerson = Math.floor(item.price_cents / memberCount);
          const extra = index < item.price_cents - perPerson * memberCount ? 1 : 0;
          itemTotalsByUser[member.user_id] = (itemTotalsByUser[member.user_id] ?? 0) + perPerson + extra;
        });
      }
    });

    // Distribute tax proportionally
    const grandItemTotal = Object.values(itemTotalsByUser).reduce((a, b) => a + b, 0);
    const splits: { user_id: string; amount_cents: number }[] = [];
    let distributedTax = 0;
    let distributedTip = 0;

    activeMembers.forEach((member, index) => {
      const userId = member.user_id;
      const itemAmt = itemTotalsByUser[userId] ?? 0;

      let total: number;
      if (index === activeMembers.length - 1) {
        total = itemAmt + (taxCents - distributedTax) + (tipCents - distributedTip);
      } else {
        const ratio = grandItemTotal > 0 ? itemAmt / grandItemTotal : 1 / memberCount;
        const userTax = Math.floor(taxCents * ratio);
        const userTip = Math.floor(tipCents * ratio);
        total = itemAmt + userTax + userTip;
        distributedTax += userTax;
        distributedTip += userTip;
      }

      splits.push({ user_id: userId, amount_cents: total });
    });

    const finalTotalCents = editedTotalCents || computedTotal;

    const input: CreateExpenseInput = {
      household_id: householdId,
      description: storeName,
      amount_cents: finalTotalCents,
      category: suggestCategory(storeName),
      paid_by: currentUserId,
      split_type: 'exact',
      splits,
      tax_cents: taxCents,
      tip_cents: tipCents,
      expense_date: date || new Date().toISOString().split('T')[0],
    };

    onConfirm(input);
  }, [
    items,
    storeName,
    date,
    taxCents,
    tipCents,
    editedTotalCents,
    computedTotal,
    members,
    currentUserId,
    householdId,
    onConfirm,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.light} />
        <Text style={styles.loadingText}>Reading your receipt...</Text>
        <View style={styles.shimmerBar} />
        <View style={styles.shimmerBarShort} />
        <View style={styles.shimmerBar} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Found {items.length} item{items.length !== 1 ? 's' : ''} -- review before saving.
        </Text>
      </View>

      {/* Store name */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Store</Text>
        <TextInput
          style={styles.storeInput}
          value={storeName}
          onChangeText={setStoreName}
          accessibilityLabel="Store name"
        />
      </View>

      {/* Date */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Date</Text>
        <TextInput
          style={styles.dateInput}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary.light}
          accessibilityLabel="Receipt date"
        />
      </View>

      {/* Line items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput
              style={styles.itemNameInput}
              value={item.name}
              onChangeText={(val) => updateItemName(index, val)}
              accessibilityLabel={`Item ${index + 1} name`}
            />
            <TextInput
              style={styles.itemPriceInput}
              value={formatCentsToString(item.price_cents)}
              onChangeText={(val) => updateItemPrice(index, val)}
              keyboardType="decimal-pad"
              accessibilityLabel={`Item ${index + 1} price`}
            />
            <ItemClassificationTag
              classification={item.classification}
              suggestedOwner={item.suggested_owner}
              members={members}
              onChange={(classification, ownerId) =>
                updateItemClassification(index, classification, ownerId)
              }
            />
          </View>
        ))}
      </View>

      {/* Tax row */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax</Text>
        <TextInput
          style={styles.summaryInput}
          value={taxStr}
          onChangeText={setTaxStr}
          keyboardType="decimal-pad"
          accessibilityLabel="Tax amount"
        />
      </View>

      {/* Tip row */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tip</Text>
        <TextInput
          style={styles.summaryInput}
          value={tipStr}
          onChangeText={setTipStr}
          keyboardType="decimal-pad"
          accessibilityLabel="Tip amount"
        />
      </View>

      {/* Total row */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <TextInput
          style={styles.totalInput}
          value={totalStr}
          onChangeText={setTotalStr}
          keyboardType="decimal-pad"
          accessibilityLabel="Total amount"
        />
      </View>

      {/* Total mismatch warning */}
      {totalMismatch && (
        <Text style={styles.mismatchWarning}>
          Warning: entered total does not match computed total (${(computedTotal / 100).toFixed(2)}). Items + tax + tip = ${(computedTotal / 100).toFixed(2)}.
        </Text>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Split Summary Preview */}
      <SplitSummaryPreview
        items={items}
        taxCents={taxCents}
        tipCents={tipCents}
        members={members}
        currentUserId={currentUserId}
      />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Confirm & Save */}
      <Pressable
        style={styles.confirmButton}
        onPress={handleConfirm}
        accessibilityLabel="Confirm & Save"
        accessibilityRole="button"
      >
        <Text style={styles.confirmButtonText}>Confirm & Save</Text>
      </Pressable>

      {/* Discard */}
      <Pressable
        style={styles.discardButton}
        onPress={onCancel}
        accessibilityLabel="Discard receipt"
        accessibilityRole="button"
      >
        <Text style={styles.discardButtonText}>Discard</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dominant.light,
    gap: 16,
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
    textAlign: 'center',
  },
  shimmerBar: {
    width: '80%',
    height: 16,
    backgroundColor: colors.border.light,
    borderRadius: 8,
  },
  shimmerBarShort: {
    width: '60%',
    height: 16,
    backgroundColor: colors.border.light,
    borderRadius: 8,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary.light,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  storeInput: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: 4,
  },
  dateInput: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary.light,
    lineHeight: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemNameInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
    paddingVertical: 4,
  },
  itemPriceInput: {
    width: 72,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
    textAlign: 'right',
    paddingVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  summaryInput: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 34,
  },
  totalInput: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 34,
    textAlign: 'right',
    width: 140,
  },
  mismatchWarning: {
    fontSize: 12,
    color: colors.sandbox.light,
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  confirmButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  discardButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: 32,
  },
  discardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
});
