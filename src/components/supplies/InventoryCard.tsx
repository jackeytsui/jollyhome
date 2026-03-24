import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus, ScanLine } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { FoodCatalogItem, InventoryItem } from '@/types/inventory';

interface InventoryCardProps {
  item: InventoryItem;
  catalogItem?: FoodCatalogItem | null;
  onAdjust: (delta: number) => void;
  onEditThreshold: () => void;
  onScan: () => void;
}

export function InventoryCard({ item, catalogItem, onAdjust, onEditThreshold, onScan }: InventoryCardProps) {
  const displayName = catalogItem?.displayName ?? catalogItem?.canonicalName ?? 'Inventory item';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.meta}>
            {item.quantityOnHand} {item.unit}
            {item.minimumQuantity !== null ? ` • min ${item.minimumQuantity}` : ''}
          </Text>
        </View>
        <Pressable onPress={onEditThreshold}>
          <Text style={styles.action}>Threshold</Text>
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.adjustButton} onPress={() => onAdjust(-1)}>
          <Minus color={colors.textPrimary.light} size={16} />
        </Pressable>
        <Pressable style={styles.adjustButton} onPress={() => onAdjust(1)}>
          <Plus color={colors.textPrimary.light} size={16} />
        </Pressable>
        <Pressable style={[styles.adjustButton, styles.scanButton]} onPress={onScan}>
          <ScanLine color="#FFFFFF" size={16} />
          <Text style={styles.scanLabel}>Scan</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary.light,
  },
  action: {
    color: colors.accent.light,
    fontWeight: '600',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    paddingHorizontal: 14,
    width: 'auto',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  scanLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
