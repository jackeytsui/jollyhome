import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { ShoppingList } from '@/types/shopping';

interface ShoppingListTabsProps {
  lists: ShoppingList[];
  activeListId: string | null;
  onSelect: (listId: string) => void;
  onCreate: () => void;
}

export function ShoppingListTabs({ lists, activeListId, onSelect, onCreate }: ShoppingListTabsProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Lists</Text>
        <Pressable onPress={onCreate} accessibilityRole="button">
          <Text style={styles.action}>New list</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          return (
            <Pressable
              key={list.id}
              onPress={() => onSelect(list.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{list.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
  row: {
    gap: 10,
    paddingRight: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
  },
  tabActive: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
