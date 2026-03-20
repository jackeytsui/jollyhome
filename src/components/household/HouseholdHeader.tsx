import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/theme';

interface HouseholdHeaderProps {
  householdName: string;
  memberCount: number;
  avatarUrl?: string | null;
  onInvitePress?: () => void;
}

export function HouseholdHeader({
  householdName,
  memberCount,
  avatarUrl,
  onInvitePress,
}: HouseholdHeaderProps) {
  const initials = householdName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <Avatar uri={avatarUrl ?? undefined} initials={initials} size="sm" />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {householdName}
        </Text>
        <Text style={styles.memberCount}>
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {onInvitePress ? (
        <Pressable onPress={onInvitePress} style={styles.inviteButton} hitSlop={8}>
          <Plus color={colors.textPrimary.light} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  memberCount: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  inviteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
