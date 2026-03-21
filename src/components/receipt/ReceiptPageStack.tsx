import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface ReceiptPageStackProps {
  pageCount: number;
  currentPage: number;
  onAddPage: () => void;
}

export function ReceiptPageStack({ pageCount, currentPage, onAddPage }: ReceiptPageStackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: pageCount }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentPage && styles.dotActive]}
          />
        ))}
      </View>
      <Pressable
        style={styles.addPageButton}
        onPress={onAddPage}
        accessibilityLabel="Add page"
        accessibilityRole="button"
      >
        <Text style={styles.addPageText}>+ Add page</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    gap: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.accent.light,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.accent.light,
  },
  addPageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 16,
  },
});
