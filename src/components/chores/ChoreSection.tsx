import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

interface ChoreSectionProps<T> {
  title: string;
  subtitle: string;
  chores: T[];
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
}

export function ChoreSection<T>({
  title,
  subtitle,
  chores,
  emptyText,
  renderItem,
}: ChoreSectionProps<T>) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {chores.length > 0 ? chores.map((item) => renderItem(item)) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    gap: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.secondary.light,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
});
