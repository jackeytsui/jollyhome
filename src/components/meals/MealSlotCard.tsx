import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GripVertical, ShoppingBasket, ChefHat } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { MealPlanEntry, MealPlanSlot } from '@/types/meals';

interface MealSlotCardProps {
  date: string;
  slot: MealPlanSlot;
  attendanceCount: number;
  entry: MealPlanEntry | null;
  onPress: () => void;
}

export function MealSlotCard({ date, slot, attendanceCount, entry, onPress }: MealSlotCardProps) {
  return (
    <Card pressable onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.kicker}>
          <GripVertical size={14} color={colors.textSecondary.light} />
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.slot}>{slot}</Text>
      </View>
      <Text style={styles.title}>{entry?.title ?? 'Assign a recipe'}</Text>
      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <ChefHat size={14} color={colors.textSecondary.light} />
          <Text style={styles.metaText}>{entry ? `${entry.servings} servings` : 'Unplanned'}</Text>
        </View>
        <View style={styles.meta}>
          <ShoppingBasket size={14} color={colors.textSecondary.light} />
          <Text style={styles.metaText}>{attendanceCount} home</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 12, color: colors.textSecondary.light, fontWeight: '600' },
  slot: { textTransform: 'capitalize', color: colors.accent.light, fontWeight: '700', fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary.light },
  metaRow: { flexDirection: 'row', gap: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSecondary.light, fontSize: 12 },
});
