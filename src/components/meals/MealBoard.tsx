import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { colors } from '@/constants/theme';
import { MealSlotCard } from './MealSlotCard';
import type { MealPlanEntry, MealPlanSlot } from '@/types/meals';

const SLOT_ORDER: MealPlanSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface MealBoardItem {
  key: string;
  date: string;
  slot: MealPlanSlot;
  entry: MealPlanEntry | null;
  attendanceCount: number;
}

export function buildMealBoardItems(
  weekDates: string[],
  entries: MealPlanEntry[],
  attendanceByDate: Record<string, string[]>
): MealBoardItem[] {
  return weekDates.flatMap((date) =>
    SLOT_ORDER.map((slot) => ({
      key: `${date}:${slot}`,
      date,
      slot,
      entry: entries.find((entry) => entry.plannedForDate === date && entry.slot === slot) ?? null,
      attendanceCount: attendanceByDate[date]?.length ?? 0,
    }))
  );
}

interface MealBoardProps {
  weekDates: string[];
  entries: MealPlanEntry[];
  attendanceByDate: Record<string, string[]>;
  onSelectSlot: (item: MealBoardItem) => void;
  onReorder: (items: MealBoardItem[]) => void;
}

export function MealBoard({ weekDates, entries, attendanceByDate, onSelectSlot, onReorder }: MealBoardProps) {
  const data = useMemo(() => buildMealBoardItems(weekDates, entries, attendanceByDate), [attendanceByDate, entries, weekDates]);

  function renderItem({ item, drag, isActive }: RenderItemParams<MealBoardItem>) {
    return (
      <View style={[styles.item, isActive && styles.itemActive]}>
        <MealSlotCard
          date={item.date}
          slot={item.slot}
          entry={item.entry}
          attendanceCount={item.attendanceCount}
          onPress={item.entry ? drag : () => onSelectSlot(item)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal board</Text>
        <Text style={styles.caption}>Drag planned meals to a new slot, or tap an empty slot to assign a recipe.</Text>
      </View>
      <DraggableFlatList
        data={data}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        onDragEnd={({ data: nextData }) => onReorder(nextData)}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { gap: 4 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary.light },
  caption: { color: colors.textSecondary.light, lineHeight: 20 },
  list: { gap: 12 },
  item: { borderRadius: 16 },
  itemActive: { opacity: 0.85 },
});
