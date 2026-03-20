import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { DietaryTag } from './DietaryTag';
import { colors } from '@/constants/theme';
import type { Member } from '@/hooks/useMembers';

interface MemberListItemProps {
  member: Member;
  isCurrentUser: boolean;
  isAdmin: boolean;
  onRemove?: (member: Member) => void;
  onPromote?: (member: Member) => void;
  onDemote?: (member: Member) => void;
}

export function MemberListItem({
  member,
  isCurrentUser,
  isAdmin,
  onRemove,
  onPromote,
  onDemote,
}: MemberListItemProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const displayName = member.profile.display_name ?? 'Unknown';
  const initials = displayName.slice(0, 2).toUpperCase();

  const canManage = isAdmin && !isCurrentUser;

  function handleMenuPress() {
    setMenuVisible(true);
  }

  function handlePromote() {
    setMenuVisible(false);
    onPromote?.(member);
  }

  function handleDemote() {
    setMenuVisible(false);
    onDemote?.(member);
  }

  function handleRemove() {
    setMenuVisible(false);
    onRemove?.(member);
  }

  return (
    <View style={styles.container}>
      <Avatar
        uri={member.profile.avatar_url ?? undefined}
        initials={initials}
        size="sm"
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{displayName}</Text>
          {isCurrentUser && (
            <Text style={styles.youLabel}> (You)</Text>
          )}
          <View style={styles.badges}>
            <Badge variant="role" label={member.role} />
            {member.status === 'pending' && (
              <View style={styles.badgeGap}>
                <Badge variant="status" label="pending" />
              </View>
            )}
          </View>
        </View>
        {member.profile.dietary_preferences.length > 0 && (
          <View style={styles.dietaryRow}>
            {member.profile.dietary_preferences.slice(0, 3).map((pref) => (
              <DietaryTag key={pref} label={pref} />
            ))}
            {member.profile.dietary_preferences.length > 3 && (
              <Text style={styles.moreText}>
                +{member.profile.dietary_preferences.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>
      {canManage && (
        <Pressable onPress={handleMenuPress} style={styles.menuButton} hitSlop={8}>
          <MoreHorizontal color={colors.textSecondary.light} size={20} />
        </Pressable>
      )}

      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            {member.role === 'member' && (
              <TouchableOpacity style={styles.menuItem} onPress={handlePromote}>
                <Text style={styles.menuItemText}>Promote to Admin</Text>
              </TouchableOpacity>
            )}
            {member.role === 'admin' && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDemote}>
                <Text style={styles.menuItemText}>Demote to Member</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDestructive]} onPress={handleRemove}>
              <Text style={styles.menuItemTextDestructive}>Remove Member</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    marginVertical: 4,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  youLabel: {
    fontSize: 14,
    color: colors.textSecondary.light,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  badgeGap: {
    marginLeft: 4,
  },
  dietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  moreText: {
    fontSize: 12,
    color: colors.textSecondary.light,
    alignSelf: 'center',
    marginLeft: 4,
  },
  menuButton: {
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: colors.dominant.light,
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemDestructive: {
    marginTop: 4,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.textPrimary.light,
  },
  menuItemTextDestructive: {
    fontSize: 16,
    color: colors.destructive.light,
    fontWeight: '600',
  },
});
