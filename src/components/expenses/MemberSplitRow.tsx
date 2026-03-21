import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import type { Member } from '@/hooks/useMembers';
import type { SplitType } from '@/types/expenses';

interface MemberSplitRowProps {
  member: Member;
  splitType: SplitType;
  value: number;
  onChange: (value: number) => void;
  isSelected: boolean;
  onToggle: () => void;
}

function getValueLabel(splitType: SplitType): string {
  switch (splitType) {
    case 'exact':
      return '$';
    case 'percentage':
      return '%';
    case 'shares':
      return 'x';
    default:
      return '';
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MemberSplitRow({
  member,
  splitType,
  value,
  onChange,
  isSelected,
  onToggle,
}: MemberSplitRowProps) {
  const displayName = member.profile.display_name ?? 'Unknown';
  const valueLabel = getValueLabel(splitType);

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }

  return (
    <Pressable style={styles.row} onPress={handleToggle}>
      {/* Checkbox */}
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(member.profile.display_name)}</Text>
      </View>

      {/* Name */}
      <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>

      {/* Value input — only for non-equal split types */}
      {splitType !== 'equal' && (
        <View style={styles.inputContainer}>
          {valueLabel === '$' && (
            <Text style={styles.inputLabel}>{valueLabel}</Text>
          )}
          <TextInput
            style={styles.valueInput}
            value={value > 0 ? value.toString() : ''}
            onChangeText={(text) => {
              const parsed = parseFloat(text);
              onChange(isNaN(parsed) ? 0 : parsed);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary.light}
            editable={isSelected}
          />
          {valueLabel !== '$' && valueLabel !== '' && (
            <Text style={styles.inputLabel}>{valueLabel}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  valueInput: {
    width: 72,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.textPrimary.light,
    textAlign: 'right',
    minHeight: 36,
    backgroundColor: colors.dominant.light,
  },
});
