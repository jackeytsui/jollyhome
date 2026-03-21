import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { distributeTaxProportionally } from '@/lib/expenseMath';
import type { ReceiptItem } from '@/hooks/useReceipt';
import type { Member } from '@/hooks/useMembers';

interface SplitSummaryPreviewProps {
  items: ReceiptItem[];
  taxCents: number;
  tipCents: number;
  members: Member[];
  currentUserId: string;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function SplitSummaryPreview({
  items,
  taxCents,
  tipCents,
  members,
  currentUserId,
}: SplitSummaryPreviewProps) {
  const activeMembers = members.filter((m) => m.status === 'active');

  const { itemTotalsByUser, sharedTotal, personalTotals, finalTotals } = useMemo(() => {
    // Separate shared vs personal items
    const sharedItems = items.filter((item) => item.classification === 'shared');
    const personalItems = items.filter((item) => item.classification === 'personal');

    const sharedTotal = sharedItems.reduce((sum, item) => sum + item.price_cents, 0);

    // Per-person share of shared items (equal split)
    const memberCount = activeMembers.length || 1;
    const sharedPerPerson = Math.floor(sharedTotal / memberCount);
    const sharedRemainder = sharedTotal - sharedPerPerson * memberCount;

    // Build per-user item totals (items before tax/tip)
    const itemTotalsByUser: Record<string, number> = {};

    activeMembers.forEach((member, index) => {
      const userId = member.user_id;
      // Share of shared items — first members get extra cent if remainder
      const sharedShare = sharedPerPerson + (index < sharedRemainder ? 1 : 0);
      itemTotalsByUser[userId] = sharedShare;
    });

    // Add personal items to their respective owners
    const personalTotals: Record<string, number> = {};
    personalItems.forEach((item) => {
      const ownerId = item.suggested_owner;
      if (ownerId) {
        personalTotals[ownerId] = (personalTotals[ownerId] ?? 0) + item.price_cents;
        itemTotalsByUser[ownerId] = (itemTotalsByUser[ownerId] ?? 0) + item.price_cents;
      } else {
        // Unassigned personal items split equally
        activeMembers.forEach((member, index) => {
          const perPerson = Math.floor(item.price_cents / memberCount);
          const extra = index < item.price_cents - perPerson * memberCount ? 1 : 0;
          itemTotalsByUser[member.user_id] = (itemTotalsByUser[member.user_id] ?? 0) + perPerson + extra;
        });
      }
    });

    // Distribute tax and tip proportionally
    const finalTotals = distributeTaxProportionally(itemTotalsByUser, taxCents, tipCents);

    return { itemTotalsByUser, sharedTotal, personalTotals, finalTotals };
  }, [items, taxCents, tipCents, activeMembers]);

  const grandTotal = Object.values(finalTotals).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Split Summary</Text>

      {/* Shared items total */}
      {sharedTotal > 0 && (
        <View style={styles.sharedRow}>
          <Text style={styles.sharedLabel}>
            Shared ({formatCents(sharedTotal)} total, {formatCents(Math.floor(sharedTotal / (activeMembers.length || 1)))} each)
          </Text>
        </View>
      )}

      {/* Per-member rows */}
      {activeMembers.map((member) => {
        const userId = member.user_id;
        const displayName = member.profile.display_name ?? 'Member';
        const total = finalTotals[userId] ?? 0;
        const isCurrentUser = userId === currentUserId;

        return (
          <View key={userId} style={styles.memberRow}>
            {/* Avatar */}
            <View style={[styles.avatar, isCurrentUser && styles.avatarCurrent]}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>

            <Text style={[styles.memberName, isCurrentUser && styles.memberNameCurrent]} numberOfLines={1}>
              {isCurrentUser ? 'You' : displayName}
              {personalTotals[userId] ? ` (+${formatCents(personalTotals[userId])} personal)` : ''}
            </Text>

            <Text style={[styles.memberTotal, isCurrentUser && styles.memberTotalCurrent]}>
              {formatCents(total)}
            </Text>
          </View>
        );
      })}

      {/* Grand total */}
      <View style={styles.divider} />
      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>Total</Text>
        <Text style={styles.grandTotalAmount}>{formatCents(grandTotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 22,
    marginBottom: 4,
  },
  sharedRow: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  sharedLabel: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarCurrent: {
    backgroundColor: colors.accent.light,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 14,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  memberNameCurrent: {
    fontWeight: '600',
  },
  memberTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
    flexShrink: 0,
  },
  memberTotalCurrent: {
    color: colors.accent.light,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
});
