import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { InventoryAlert } from '@/types/inventory';
import type { ShoppingListItem } from '@/types/shopping';

interface LowStockAlertCardProps {
  alert: InventoryAlert;
  linkedRestockItem?: ShoppingListItem | null;
}

export function LowStockAlertCard({ alert, linkedRestockItem }: LowStockAlertCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <AlertTriangle color={colors.sandbox.light} size={18} />
        <Text style={styles.title}>{alert.title}</Text>
      </View>
      <Text style={styles.message}>{alert.message ?? 'Inventory dropped below the configured minimum.'}</Text>
      <Text style={styles.linked}>
        {linkedRestockItem
          ? `auto-added to ${linkedRestockItem.title} on the active shopping list`
          : 'not yet linked to an active shopping restock item'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderColor: colors.sandbox.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  message: {
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  linked: {
    color: colors.accent.light,
    fontWeight: '600',
    lineHeight: 20,
  },
});
