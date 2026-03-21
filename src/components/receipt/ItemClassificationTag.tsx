import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import type { Member } from '@/hooks/useMembers';

interface ItemClassificationTagProps {
  classification: 'shared' | 'personal';
  suggestedOwner: string | null;
  members: Member[];
  onChange: (classification: 'shared' | 'personal', ownerId: string | null) => void;
}

export function ItemClassificationTag({
  classification,
  suggestedOwner,
  members,
  onChange,
}: ItemClassificationTagProps) {
  // Build the ordered cycle: Shared -> Personal:Me -> Personal:[Member1] -> ...
  // Members are all active household members
  const activeMembers = members.filter((m) => m.status === 'active');

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (classification === 'shared') {
      // Move to first personal: suggest the owner if known, else first member
      if (suggestedOwner) {
        onChange('personal', suggestedOwner);
      } else if (activeMembers.length > 0) {
        onChange('personal', activeMembers[0].user_id);
      } else {
        onChange('personal', null);
      }
    } else {
      // Currently personal — find current member index and advance
      if (!suggestedOwner) {
        // No owner assigned → go back to shared
        onChange('shared', null);
        return;
      }

      const currentIndex = activeMembers.findIndex((m) => m.user_id === suggestedOwner);
      const nextIndex = currentIndex + 1;

      if (nextIndex >= activeMembers.length) {
        // Cycle back to shared after last member
        onChange('shared', null);
      } else {
        onChange('personal', activeMembers[nextIndex].user_id);
      }
    }
  }, [classification, suggestedOwner, activeMembers, onChange]);

  // Determine display label
  let label: string;
  if (classification === 'shared') {
    label = 'Shared';
  } else {
    const owner = activeMembers.find((m) => m.user_id === suggestedOwner);
    const ownerName = owner?.profile.display_name ?? 'Someone';
    label = `Personal: ${ownerName}`;
  }

  const isShared = classification === 'shared';

  return (
    <View style={styles.touchTarget}>
      <Pressable
        style={[styles.pill, isShared ? styles.pillShared : styles.pillPersonal]}
        onPress={handleToggle}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityHint="Tap to toggle between Shared and Personal"
      >
        <Text style={[styles.label, isShared ? styles.labelShared : styles.labelPersonal]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  pill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillShared: {
    backgroundColor: colors.success.light,
  },
  pillPersonal: {
    backgroundColor: colors.sandbox.light,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  labelShared: {
    color: '#FFFFFF',
  },
  labelPersonal: {
    color: '#FFFFFF',
  },
});
