import React, { useState, useCallback, useEffect } from 'react';
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
import type { ReceiptData, ReceiptItem } from '@/hooks/useReceipt';
import type { Member } from '@/hooks/useMembers';
import type { CreateExpenseInput } from '@/types/expenses';
import {
  buildReceiptExpenseInput,
  type GroceryReceiptReview,
} from '@/lib/receiptWorkflow';

interface ReceiptReviewCardProps {
  receiptData: ReceiptData;
  members: Member[];
  currentUserId: string;
  householdId: string;
  groceryReview?: GroceryReceiptReview | null;
  onConfirm: (input: { expenseInput: CreateExpenseInput; groceryReview: GroceryReceiptReview | null }) => void;
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
  groceryReview = null,
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
  const [groceryItems, setGroceryItems] = useState(groceryReview?.items ?? []);

  useEffect(() => {
    setItems(receiptData.items);
    setGroceryItems(groceryReview?.items ?? []);
  }, [receiptData, groceryReview]);

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

    const expenseInput = buildReceiptExpenseInput({
      receiptData,
      items,
      taxCents,
      tipCents,
      totalCents: editedTotalCents || computedTotal,
      storeName,
      date,
      members,
      currentUserId,
      householdId,
    });

    const finalGroceryReview = groceryReview ? {
      ...groceryReview,
      storeName,
      date,
      items: groceryItems.map((groceryItem, index) => ({
        ...groceryItem,
        receiptItemName: items[index]?.name ?? groceryItem.receiptItemName,
        displayName: groceryItem.displayName.trim() || items[index]?.name || groceryItem.receiptItemName,
        priceCents: items[index]?.price_cents ?? groceryItem.priceCents,
        classification: items[index]?.classification ?? groceryItem.classification,
        suggestedOwner: items[index]?.suggested_owner ?? groceryItem.suggestedOwner,
        matchedShoppingItemIds: groceryItem.includeShoppingMatches ? groceryItem.matchedShoppingItemIds : [],
      })),
    } : null;

    onConfirm({ expenseInput, groceryReview: finalGroceryReview });
  }, [
    receiptData,
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
    groceryItems,
    groceryReview,
    onConfirm,
  ]);

  const updateGroceryItem = useCallback((index: number, updates: Partial<(typeof groceryItems)[number]>) => {
    setGroceryItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...updates } : item
    )));
  }, []);

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

      {groceryReview ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pantry + Shopping Sync</Text>
            {groceryItems.map((item, index) => (
              <View key={`grocery-${index}`} style={styles.groceryCard}>
                <Text style={styles.groceryLabel}>Pantry item name</Text>
                <TextInput
                  style={styles.groceryInput}
                  value={item.displayName}
                  onChangeText={(value) => updateGroceryItem(index, { displayName: value })}
                  accessibilityLabel={`Pantry item ${index + 1} name`}
                />
                <View style={styles.groceryMetaRow}>
                  <View style={styles.groceryMetaBlock}>
                    <Text style={styles.groceryMetaLabel}>Qty</Text>
                    <TextInput
                      style={styles.groceryQtyInput}
                      value={String(item.quantity)}
                      onChangeText={(value) => updateGroceryItem(index, { quantity: Math.max(0, Number(value) || 0) })}
                      keyboardType="decimal-pad"
                      accessibilityLabel={`Pantry item ${index + 1} quantity`}
                    />
                  </View>
                  <View style={styles.groceryMetaBlockWide}>
                    <Text style={styles.groceryMetaLabel}>Unit / Category</Text>
                    <Text style={styles.groceryMetaValue}>{item.unit} • {item.categoryKey}</Text>
                  </View>
                </View>
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[styles.togglePill, item.shouldAddToPantry && styles.togglePillActive]}
                    onPress={() => updateGroceryItem(index, { shouldAddToPantry: !item.shouldAddToPantry })}
                  >
                    <Text style={[styles.togglePillText, item.shouldAddToPantry && styles.togglePillTextActive]}>
                      {item.shouldAddToPantry ? 'Add to pantry' : 'Skip pantry'}
                    </Text>
                  </Pressable>
                  {item.matchedShoppingItemLabels.length > 0 ? (
                    <Pressable
                      style={[styles.togglePill, item.includeShoppingMatches && styles.togglePillActive]}
                      onPress={() => updateGroceryItem(index, { includeShoppingMatches: !item.includeShoppingMatches })}
                    >
                      <Text style={[styles.togglePillText, item.includeShoppingMatches && styles.togglePillTextActive]}>
                        {item.includeShoppingMatches ? 'Match shopping items' : 'Skip shopping match'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {item.matchedShoppingItemLabels.length > 0 ? (
                  <Text style={styles.groceryMatchText}>
                    Shopping matches: {item.matchedShoppingItemLabels.join(', ')}
                  </Text>
                ) : (
                  <Text style={styles.groceryMatchText}>No pending shopping match found.</Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.divider} />
        </>
      ) : null}

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
  groceryCard: {
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  groceryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  groceryInput: {
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  groceryMetaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  groceryMetaBlock: {
    width: 92,
    gap: 4,
  },
  groceryMetaBlockWide: {
    flex: 1,
    gap: 4,
  },
  groceryMetaLabel: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
  groceryMetaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  groceryQtyInput: {
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  togglePill: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  togglePillActive: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  groceryMatchText: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
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
