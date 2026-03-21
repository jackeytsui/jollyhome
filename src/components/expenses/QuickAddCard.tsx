import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { calculateSplit } from '@/lib/expenseMath';
import { SplitTypeSelector } from './SplitTypeSelector';
import { MemberSplitRow } from './MemberSplitRow';
import { CategoryChipSuggestion } from './CategoryChipSuggestion';
import type { Member } from '@/hooks/useMembers';
import type { SplitType, SplitPreset, CreateExpenseInput } from '@/types/expenses';
import { useHouseholdStore } from '@/stores/household';
import { useAuthStore } from '@/stores/auth';

interface QuickAddCardProps {
  onSave: (input: CreateExpenseInput) => void;
  members: Member[];
  presets: SplitPreset[];
  prefilled?: Partial<CreateExpenseInput>;
  confidenceFlags?: string[];
}

export function QuickAddCard({
  onSave,
  members,
  presets,
  prefilled,
  confidenceFlags = [],
}: QuickAddCardProps) {
  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();

  const [amountStr, setAmountStr] = useState(
    prefilled?.amount_cents ? (prefilled.amount_cents / 100).toFixed(2) : ''
  );
  const [description, setDescription] = useState(prefilled?.description ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    prefilled?.category ?? null
  );
  const [splitType, setSplitType] = useState<SplitType>(prefilled?.split_type ?? 'equal');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id))
  );
  const [splitValues, setSplitValues] = useState<Record<string, number>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [expenseDate, setExpenseDate] = useState(
    prefilled?.expense_date ?? new Date().toISOString().split('T')[0]
  );
  const [taxStr, setTaxStr] = useState(
    prefilled?.tax_cents ? (prefilled.tax_cents / 100).toFixed(2) : ''
  );
  const [tipStr, setTipStr] = useState(
    prefilled?.tip_cents ? (prefilled.tip_cents / 100).toFixed(2) : ''
  );
  const [isPrivate, setIsPrivate] = useState(prefilled?.is_private ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function handleSplitSelect(type: SplitType, presetId?: string) {
    setSplitType(type);
    setSelectedPresetId(presetId);
  }

  function handleMemberToggle(userId: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function handleSplitValueChange(userId: string, value: number) {
    setSplitValues((prev) => ({ ...prev, [userId]: value }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const amountCents = Math.round(parseFloat(amountStr) * 100);

    if (!amountStr || isNaN(amountCents) || amountCents <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!description.trim()) {
      newErrors.description = 'Please enter a description';
    }
    if (selectedMemberIds.size === 0) {
      newErrors.members = 'Select at least one member';
    }

    // Validate split values for non-equal types
    if (splitType === 'percentage') {
      const total = [...selectedMemberIds].reduce(
        (sum, uid) => sum + (splitValues[uid] ?? 0),
        0
      );
      if (Math.round(total) !== 100) {
        newErrors.split = `Percentages must sum to 100% (currently ${total.toFixed(1)}%)`;
      }
    }
    if (splitType === 'exact') {
      const total = [...selectedMemberIds].reduce(
        (sum, uid) => sum + (splitValues[uid] ?? 0),
        0
      );
      const totalCents = Math.round(total * 100);
      if (totalCents !== amountCents) {
        newErrors.split = `Exact amounts must sum to ${(amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    if (!activeHouseholdId || !user) return;

    setSaving(true);
    try {
      const amountCents = Math.round(parseFloat(amountStr) * 100);
      const selectedUsers = members.filter((m) => selectedMemberIds.has(m.user_id));

      // Calculate splits based on split type
      let splits: { user_id: string; amount_cents: number }[] = [];

      if (splitType === 'equal') {
        const amounts = calculateSplit(
          'equal',
          amountCents,
          selectedUsers.map((m) => m.user_id)
        );
        splits = selectedUsers.map((m, i) => ({
          user_id: m.user_id,
          amount_cents: amounts[i],
        }));
      } else if (splitType === 'percentage') {
        const weighted = selectedUsers.map((m) => ({
          userId: m.user_id,
          value: splitValues[m.user_id] ?? 0,
        }));
        const result = calculateSplit('percentage', amountCents, weighted);
        splits = result.map((r) => ({ user_id: r.userId, amount_cents: r.amount }));
      } else if (splitType === 'exact') {
        // Exact values are entered in dollars, convert to cents
        splits = selectedUsers.map((m) => ({
          user_id: m.user_id,
          amount_cents: Math.round((splitValues[m.user_id] ?? 0) * 100),
        }));
      } else if (splitType === 'shares') {
        const weighted = selectedUsers.map((m) => ({
          userId: m.user_id,
          value: splitValues[m.user_id] ?? 1,
        }));
        const result = calculateSplit('shares', amountCents, weighted);
        splits = result.map((r) => ({ user_id: r.userId, amount_cents: r.amount }));
      } else if (splitType === 'preset' && selectedPresetId) {
        // Find the preset and use its percentages
        const preset = presets.find((p) => p.id === selectedPresetId);
        if (preset) {
          const weighted = preset.shares.map((s) => ({
            userId: s.user_id,
            value: s.percentage,
          }));
          const result = calculateSplit('percentage', amountCents, weighted);
          splits = result.map((r) => ({ user_id: r.userId, amount_cents: r.amount }));
        }
      }

      const input: CreateExpenseInput = {
        household_id: activeHouseholdId,
        description: description.trim(),
        amount_cents: amountCents,
        category: selectedCategory,
        paid_by: user.id,
        split_type: splitType,
        splits,
        tax_cents: taxStr ? Math.round(parseFloat(taxStr) * 100) : 0,
        tip_cents: tipStr ? Math.round(parseFloat(tipStr) * 100) : 0,
        is_private: isPrivate,
        expense_date: expenseDate,
      };

      await onSave(input);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setAmountStr('');
      setDescription('');
      setSelectedCategory(null);
      setSplitType('equal');
      setSelectedMemberIds(new Set(members.map((m) => m.user_id)));
      setSplitValues({});
      setShowDetails(false);
      setTaxStr('');
      setTipStr('');
      setIsPrivate(false);
      setErrors({});
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  }

  const isAmountConfident = confidenceFlags.includes('amount');
  const isDescriptionConfident = confidenceFlags.includes('description');

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Amount input */}
        <View
          style={[
            styles.amountContainer,
            isAmountConfident && styles.confidentField,
          ]}
        >
          {isAmountConfident && (
            <Text style={styles.jollyChip}>Jolly filled</Text>
          )}
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary.light}
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="decimal-pad"
            textAlign="center"
          />
        </View>
        {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

        {/* Description input */}
        <View
          style={[
            styles.inputWrapper,
            isDescriptionConfident && styles.confidentField,
          ]}
        >
          {isDescriptionConfident && (
            <Text style={styles.jollyChip}>Jolly filled</Text>
          )}
          <TextInput
            style={styles.descriptionInput}
            placeholder="What was this for?"
            placeholderTextColor={colors.textSecondary.light}
            value={description}
            onChangeText={setDescription}
            returnKeyType="done"
          />
        </View>
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

        {/* Category suggestion */}
        <CategoryChipSuggestion
          description={description}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Split type selector */}
        <View style={styles.section}>
          <SplitTypeSelector
            selected={splitType}
            presets={presets}
            onSelect={handleSplitSelect}
          />
        </View>

        {/* Member split rows for non-equal types */}
        {splitType !== 'equal' && (
          <View style={styles.section}>
            {members.map((member) => (
              <MemberSplitRow
                key={member.user_id}
                member={member}
                splitType={splitType}
                value={splitValues[member.user_id] ?? 0}
                onChange={(val) => handleSplitValueChange(member.user_id, val)}
                isSelected={selectedMemberIds.has(member.user_id)}
                onToggle={() => handleMemberToggle(member.user_id)}
              />
            ))}
            {errors.split ? <Text style={styles.errorText}>{errors.split}</Text> : null}
          </View>
        )}

        {/* More details toggle */}
        <Pressable
          style={styles.moreDetailsToggle}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowDetails(!showDetails);
          }}
        >
          <Text style={styles.moreDetailsText}>
            {showDetails ? 'Less details ↑' : 'More details ↓'}
          </Text>
        </Pressable>

        {/* Expanded details */}
        {showDetails && (
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.detailInput}
                value={expenseDate}
                onChangeText={setExpenseDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tax ($)</Text>
              <TextInput
                style={styles.detailInput}
                value={taxStr}
                onChangeText={setTaxStr}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tip ($)</Text>
              <TextInput
                style={styles.detailInput}
                value={tipStr}
                onChangeText={setTipStr}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary.light}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Private</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ true: colors.accent.light }}
              />
            </View>
          </View>
        )}

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Add Expense'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.dominant.light,
    gap: 4,
  },
  confidentField: {
    borderColor: colors.accent.light,
    borderWidth: 2,
  },
  jollyChip: {
    position: 'absolute',
    top: -10,
    left: 12,
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent.light,
    backgroundColor: colors.dominant.light,
    paddingHorizontal: 6,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary.light,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 34,
    minWidth: 120,
    textAlign: 'center',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    backgroundColor: colors.dominant.light,
  },
  descriptionInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
    minHeight: 44,
  },
  section: {
    gap: 4,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive.light,
    lineHeight: 20,
    marginTop: -8,
  },
  moreDetailsToggle: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  moreDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 20,
  },
  detailsSection: {
    gap: 8,
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.textPrimary.light,
    minWidth: 100,
    textAlign: 'right',
    backgroundColor: colors.dominant.light,
  },
  saveButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
});
