import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

type BadgeVariant = 'role' | 'status' | 'tier';

type RoleLabel = 'admin' | 'member';
type StatusLabel = 'active' | 'pending';
type TierLabel = 'free' | 'plus' | 'pro';

type BadgeLabel = RoleLabel | StatusLabel | TierLabel | string;

interface BadgeProps {
  variant: BadgeVariant;
  label: BadgeLabel;
}

interface BadgeStyle {
  bg: string;
  text: string;
}

const roleStyles: Record<string, BadgeStyle> = {
  admin: { bg: colors.accent.light, text: '#FFFFFF' },
  member: { bg: colors.secondary.light, text: colors.textPrimary.light },
};

const statusStyles: Record<string, BadgeStyle> = {
  active: { bg: colors.success.light, text: '#FFFFFF' },
  pending: { bg: colors.sandbox.light, text: '#FFFFFF' },
};

const tierStyles: Record<string, BadgeStyle> = {
  free: { bg: colors.secondary.light, text: colors.textPrimary.light },
  plus: { bg: colors.accent.light, text: '#FFFFFF' },
  pro: { bg: colors.accent.light, text: '#FFFFFF' },
};

function getBadgeStyle(variant: BadgeVariant, label: string): BadgeStyle {
  const defaultStyle: BadgeStyle = { bg: colors.secondary.light, text: colors.textPrimary.light };

  switch (variant) {
    case 'role':
      return roleStyles[label] ?? defaultStyle;
    case 'status':
      return statusStyles[label] ?? defaultStyle;
    case 'tier':
      return tierStyles[label] ?? defaultStyle;
    default:
      return defaultStyle;
  }
}

export function Badge({ variant, label }: BadgeProps) {
  const badgeStyle = getBadgeStyle(variant, label);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: badgeStyle.bg },
      ]}
    >
      <Text style={[styles.text, { color: badgeStyle.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
