import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flag } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface DisputeBadgeProps {
  status: 'open' | 'resolved';
}

export function DisputeBadge({ status }: DisputeBadgeProps) {
  const isOpen = status === 'open';

  return (
    <View style={[styles.badge, isOpen ? styles.openBadge : styles.resolvedBadge]}>
      <Flag
        size={12}
        color={isOpen ? colors.sandbox.light : colors.success.light}
        strokeWidth={2.5}
      />
      <Text style={[styles.label, isOpen ? styles.openLabel : styles.resolvedLabel]}>
        {isOpen ? 'Disputed' : 'Resolved'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  openBadge: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: colors.sandbox.light,
  },
  resolvedBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: colors.success.light,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  openLabel: {
    color: colors.sandbox.light,
  },
  resolvedLabel: {
    color: colors.success.light,
  },
});
