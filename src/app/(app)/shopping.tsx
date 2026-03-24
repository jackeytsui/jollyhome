import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AisleGroupSection } from '@/components/shopping/AisleGroupSection';
import { ShoppingItemEditorSheet, type ShoppingItemEditorValues } from '@/components/shopping/ShoppingItemEditorSheet';
import { ShoppingListTabs } from '@/components/shopping/ShoppingListTabs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { useShopping } from '@/hooks/useShopping';
import type { ShoppingListItem } from '@/types/shopping';

export default function ShoppingScreen() {
  const {
    lists,
    activeListId,
    activeList,
    groupedItems,
    loading,
    error,
    setActiveListId,
    createList,
    createItem,
    updateItem,
    toggleItemChecked,
  } = useShopping();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [saving, setSaving] = useState(false);

  const activeCount = useMemo(
    () => groupedItems.reduce((count, group) => count + group.items.filter((item) => !item.checkedOffAt).length, 0),
    [groupedItems]
  );

  async function ensureActiveList() {
    if (activeListId) {
      return activeListId;
    }

    const listId = await createList({ title: 'Household essentials' });
    setActiveListId(listId);
    return listId;
  }

  async function handleSubmit(values: ShoppingItemEditorValues) {
    setSaving(true);
    try {
      const listId = await ensureActiveList();

      if (editingItem) {
        await updateItem(editingItem.id, values);
      } else {
        await createItem({
          listId,
          title: values.title,
          note: values.note || null,
          category: values.category,
          quantity: values.quantity,
          unit: values.unit,
        });
      }

      setEditorVisible(false);
      setEditingItem(null);
    } catch (err) {
      Alert.alert('Unable to save item', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Phase 04</Text>
          <Text style={styles.title}>Shopping</Text>
          <Text style={styles.subtitle}>
            Shared household lists grouped by aisle, with checked items kept visible at the bottom.
          </Text>
        </View>

        <ShoppingListTabs
          lists={lists.filter((list) => list.status === 'active')}
          activeListId={activeListId}
          onSelect={setActiveListId}
          onCreate={async () => {
            const label = `List ${lists.filter((list) => list.status === 'active').length + 1}`;
            const listId = await createList({ title: label });
            setActiveListId(listId);
          }}
        />

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>{activeList?.title ?? 'No active list yet'}</Text>
              <Text style={styles.summaryMeta}>
                {activeCount} unchecked item{activeCount === 1 ? '' : 's'}
              </Text>
            </View>
            <Button
              label="Add item"
              onPress={() => {
                setEditingItem(null);
                setEditorVisible(true);
              }}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? <Text style={styles.loading}>Syncing shopping lists…</Text> : null}
        </Card>

        {groupedItems.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>Nothing on the list yet.</Text>
            <Text style={styles.emptyBody}>Start with staples, tonight&apos;s dinner, or the next low-stock restock.</Text>
          </Card>
        ) : (
          groupedItems.map((group) => (
            <AisleGroupSection
              key={group.category}
              category={group.category}
              items={group.items}
              onToggleChecked={(item) => toggleItemChecked(item.id, !item.checkedOffAt)}
              onEdit={(item) => {
                setEditingItem(item);
                setEditorVisible(true);
              }}
            />
          ))
        )}
      </ScrollView>

      <ShoppingItemEditorSheet
        visible={editorVisible}
        initialValues={editingItem}
        loading={saving}
        onClose={() => {
          setEditorVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.light,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
  summaryCard: {
    gap: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  summaryMeta: {
    color: colors.textSecondary.light,
    marginTop: 4,
  },
  error: {
    color: colors.destructive.light,
  },
  loading: {
    color: colors.textSecondary.light,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  emptyBody: {
    marginTop: 6,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
});
