import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { ExpenseVersion } from '@/types/expenses';

interface ChangeHistoryRowProps {
  version: ExpenseVersion;
  memberName: string;
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
}

function getActionText(version: ExpenseVersion, memberName: string): string {
  switch (version.change_type) {
    case 'created':
      return `${memberName} created this expense`;
    case 'deleted':
      return `${memberName} deleted this expense`;
    case 'edited': {
      const fields = version.changed_fields?.join(', ') ?? 'details';
      return `${memberName} edited ${fields}`;
    }
    default:
      return `${memberName} made a change`;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ChangeHistoryRow({ version, memberName }: ChangeHistoryRowProps) {
  const [expanded, setExpanded] = useState(false);

  const hasDiff =
    version.change_type === 'edited' &&
    version.previous_data != null &&
    version.changed_fields != null &&
    version.changed_fields.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(memberName)}</Text>
        </View>

        {/* Action + timestamp */}
        <View style={styles.content}>
          <Text style={styles.actionText}>{getActionText(version, memberName)}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(version.created_at)}</Text>
        </View>

        {/* Expand toggle if diff available */}
        {hasDiff && (
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
            <Text style={styles.expandText}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
        )}
      </View>

      {/* Diff section */}
      {expanded && hasDiff && version.previous_data && version.changed_fields && (
        <View style={styles.diffContainer}>
          {version.changed_fields.map((field) => {
            const oldVal = version.previous_data?.[field];
            return (
              <View key={field} style={styles.diffRow}>
                <Text style={styles.diffField}>{field}:</Text>
                <Text style={styles.diffOld}>{String(oldVal ?? '—')}</Text>
                <Text style={styles.diffArrow}>→</Text>
                <Text style={styles.diffNew}>updated</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  expandBtn: {
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandText: {
    fontSize: 10,
    color: colors.textSecondary.light,
  },
  diffContainer: {
    marginTop: 8,
    marginLeft: 28,
    padding: 8,
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    gap: 4,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  diffField: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
  },
  diffOld: {
    fontSize: 14,
    color: colors.destructive.light,
    textDecorationLine: 'line-through',
  },
  diffArrow: {
    fontSize: 14,
    color: colors.textSecondary.light,
  },
  diffNew: {
    fontSize: 14,
    color: colors.success.light,
    fontStyle: 'italic',
  },
});
