import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { BalanceSkeletonCard } from './BalanceSkeletonCard';
import type { Balance } from '@/types/expenses';
import type { Member } from '@/hooks/useMembers';

interface BalanceSummaryCardProps {
  netBalances: Record<string, number>;
  simplifiedDebts: Balance[];
  members: Member[];
  onMemberPress: (userId: string) => void;
  loading: boolean;
  currentUserId?: string;
}

function formatCurrency(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function getMemberName(members: Member[], userId: string): string {
  const member = members.find((m) => m.user_id === userId);
  return member?.profile.display_name ?? 'Unknown';
}

const COLLAPSED_HEIGHT = 56;
const EXPANDED_HEIGHT = 200;

export function BalanceSummaryCard({
  netBalances,
  simplifiedDebts,
  members,
  onMemberPress,
  loading,
  currentUserId,
}: BalanceSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(COLLAPSED_HEIGHT);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  if (loading) return <BalanceSkeletonCard />;

  function toggleExpanded() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !expanded;
    setExpanded(next);
    height.value = withTiming(next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }

  // Determine headline text
  const userBalance = currentUserId ? (netBalances[currentUserId] ?? 0) : 0;
  const allSettledUp = simplifiedDebts.length === 0;

  let headlineText: string;
  let headlineColor: string;

  if (allSettledUp) {
    headlineText = 'All settled up';
    headlineColor = colors.textPrimary.light;
  } else if (userBalance > 0) {
    headlineText = `You're owed ${formatCurrency(userBalance)}`;
    headlineColor = colors.success.light;
  } else if (userBalance < 0) {
    headlineText = `You owe ${formatCurrency(userBalance)}`;
    headlineColor = colors.destructive.light;
  } else {
    headlineText = `${simplifiedDebts.length} debt${simplifiedDebts.length === 1 ? '' : 's'} outstanding`;
    headlineColor = colors.textPrimary.light;
  }

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Header — always visible */}
      <Pressable style={styles.header} onPress={toggleExpanded}>
        <Text style={[styles.headline, { color: headlineColor }]} numberOfLines={1}>
          {headlineText}
        </Text>
        <Text style={styles.chevron}>{expanded ? '↑' : '↓'}</Text>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.memberList}>
          {Object.entries(netBalances).length === 0 ? (
            <Text style={styles.settledSub}>
              No outstanding debts in your household.
            </Text>
          ) : (
            Object.entries(netBalances).map(([userId, balance]) => {
              const isPositive = balance >= 0;
              return (
                <Pressable
                  key={userId}
                  style={styles.memberRow}
                  onPress={() => onMemberPress(userId)}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getMemberName(members, userId).slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.memberName}>
                      {getMemberName(members, userId)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { color: isPositive ? colors.success.light : colors.destructive.light },
                    ]}
                  >
                    {isPositive ? '+' : '-'}{formatCurrency(balance)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: COLLAPSED_HEIGHT,
  },
  headline: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    flex: 1,
  },
  chevron: {
    fontSize: 16,
    color: colors.textSecondary.light,
    marginLeft: 8,
  },
  memberList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  memberName: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  settledSub: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
    paddingVertical: 8,
  },
});
