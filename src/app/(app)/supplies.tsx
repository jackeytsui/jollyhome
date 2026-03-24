import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { stagePantryPhotoReview, type StagedPantryPhotoItem } from '@/lib/foodNormalization';
import { buildPredictiveRestockSuggestions } from '@/lib/mealPlanning';
import { supabase } from '@/lib/supabase';
import { BarcodeScannerSheet } from '@/components/supplies/BarcodeScannerSheet';
import { InventoryCard } from '@/components/supplies/InventoryCard';
import { LowStockAlertCard } from '@/components/supplies/LowStockAlertCard';
import { PantryPhotoReviewSheet } from '@/components/supplies/PantryPhotoReviewSheet';
import { ThresholdEditorSheet } from '@/components/supplies/ThresholdEditorSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { useInventory } from '@/hooks/useInventory';
import { useShopping } from '@/hooks/useShopping';
import type { InventoryItem } from '@/types/inventory';

export default function SuppliesScreen() {
  const { catalogItems, inventoryItems, inventoryEvents, lowStockAlerts, loading, error, adjustStock, updateThreshold, resolveCatalogItem } = useInventory();
  const { activeListItems, createItem, activeListId, createList, setActiveListId } = useShopping();

  const [editingThreshold, setEditingThreshold] = useState<InventoryItem | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<InventoryItem | null>(null);
  const [photoReviewItems, setPhotoReviewItems] = useState<StagedPantryPhotoItem[]>([]);
  const [photoReviewVisible, setPhotoReviewVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const catalogById = useMemo(() => new Map(catalogItems.map((item) => [item.id, item])), [catalogItems]);
  const predictiveRestocks = useMemo(
    () => buildPredictiveRestockSuggestions({ inventoryItems, inventoryEvents, alerts: lowStockAlerts }),
    [inventoryEvents, inventoryItems, lowStockAlerts]
  );

  async function ensureShoppingList() {
    if (activeListId) {
      return activeListId;
    }

    const listId = await createList({ title: 'Household essentials' });
    setActiveListId(listId);
    return listId;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Phase 04</Text>
          <Text style={styles.title}>Supplies</Text>
          <Text style={styles.subtitle}>
            Pantry stock, low-stock alerts, barcode adds, and threshold edits backed by the shared food hooks.
          </Text>
        </View>

        <Card style={styles.banner}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerCopy}>
              <Text style={styles.bannerTitle}>Low-stock watch</Text>
              <Text style={styles.bannerMeta}>{lowStockAlerts.length} open alert{lowStockAlerts.length === 1 ? '' : 's'}</Text>
            </View>
            <Button
              label="Scan new item"
              onPress={() => {
                setScannerTarget(null);
                setScannerVisible(true);
              }}
            />
            <Button
              label="Pantry photo"
              variant="secondary"
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]?.uri) {
                  try {
                    const { data, error: fnError } = await supabase.functions.invoke('identify-pantry-items', {
                      body: { image_uri: result.assets[0].uri },
                    });
                    if (fnError) {
                      throw fnError;
                    }
                    const staged = stagePantryPhotoReview({
                      detections: data?.review_items ?? [],
                      catalog: catalogItems,
                    });
                    setPhotoReviewItems(staged);
                    setPhotoReviewVisible(true);
                  } catch (err) {
                    Alert.alert('Unable to analyze pantry photo', err instanceof Error ? err.message : 'Please try again.');
                  }
                }
              }}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? <Text style={styles.loading}>Refreshing pantry…</Text> : null}
        </Card>

        {lowStockAlerts.map((alert) => {
          const linked = activeListItems.find((item) => item.generatedRestock?.inventoryAlertId === alert.id) ?? null;
          return <LowStockAlertCard key={alert.id} alert={alert} linkedRestockItem={linked} />;
        })}
        {predictiveRestocks.map((prediction) => (
          <Card key={prediction.inventoryItemId} style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>Predicted restock</Text>
            <Text style={styles.predictionBody}>
              {prediction.reason} • suggest buying {prediction.suggestedQuantity} {prediction.unit}
            </Text>
          </Card>
        ))}

        {inventoryItems.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>No pantry stock yet.</Text>
            <Text style={styles.emptyBody}>Scan a barcode or create the first pantry item as you shop.</Text>
          </Card>
        ) : (
          inventoryItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              catalogItem={catalogById.get(item.catalogItemId)}
              onAdjust={async (delta) => {
                try {
                  await adjustStock({
                    catalogItemId: item.catalogItemId,
                    quantityDelta: delta,
                    unit: item.unit,
                  });
                } catch (err) {
                  Alert.alert('Unable to adjust stock', err instanceof Error ? err.message : 'Please try again.');
                }
              }}
              onEditThreshold={() => setEditingThreshold(item)}
              onScan={() => {
                setScannerTarget(item);
                setScannerVisible(true);
              }}
            />
          ))
        )}
      </ScrollView>

      <ThresholdEditorSheet
        visible={Boolean(editingThreshold)}
        title={editingThreshold ? catalogById.get(editingThreshold.catalogItemId)?.displayName ?? 'Inventory item' : 'Inventory item'}
        unit={editingThreshold?.unit ?? 'count'}
        currentMinimumQuantity={editingThreshold?.minimumQuantity ?? null}
        currentPreferredReorderQuantity={editingThreshold?.preferredReorderQuantity ?? null}
        loading={saving}
        onClose={() => setEditingThreshold(null)}
        onSubmit={async (values) => {
          if (!editingThreshold) {
            return;
          }

          setSaving(true);
          try {
            await updateThreshold({
              catalogItemId: editingThreshold.catalogItemId,
              unit: editingThreshold.unit,
              minimumQuantity: values.minimumQuantity,
              preferredReorderQuantity: values.preferredReorderQuantity,
            });
            setEditingThreshold(null);

            if (values.minimumQuantity !== null && editingThreshold.quantityOnHand <= values.minimumQuantity) {
              const listId = await ensureShoppingList();
              const catalogItem = catalogById.get(editingThreshold.catalogItemId);
              await createItem({
                listId,
                title: catalogItem?.displayName ?? 'Restock item',
                category: catalogItem?.category ?? 'other',
                quantity: (values.preferredReorderQuantity ?? values.minimumQuantity) - editingThreshold.quantityOnHand,
                unit: editingThreshold.unit,
                inventoryItemId: editingThreshold.id,
                catalogItemId: editingThreshold.catalogItemId,
                minimumQuantity: values.minimumQuantity,
                source: 'restock',
              });
            }
          } catch (err) {
            Alert.alert('Unable to update threshold', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <BarcodeScannerSheet
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onDetected={async ({ value, type }) => {
          try {
            const resolved = await resolveCatalogItem({
              name: scannerTarget ? catalogById.get(scannerTarget.catalogItemId)?.displayName ?? `Barcode ${value}` : `Barcode ${value}`,
              barcode: value,
              unit: scannerTarget?.unit ?? 'count',
            });

            if (!resolved) {
              throw new Error(`No matching catalog item for barcode type ${type}.`);
            }

            await adjustStock({
              catalogItemId: resolved.id,
              quantityDelta: 1,
              unit: scannerTarget?.unit ?? resolved.defaultUnit,
              reason: `Barcode scan (${value})`,
            });
            setScannerVisible(false);
          } catch (err) {
            Alert.alert('Unable to process barcode', err instanceof Error ? err.message : 'Please try again.');
          }
        }}
      />

      <PantryPhotoReviewSheet
        visible={photoReviewVisible}
        items={photoReviewItems}
        loading={saving}
        onClose={() => setPhotoReviewVisible(false)}
        onAcceptItem={async (item) => {
          try {
            setSaving(true);
            const resolved = await resolveCatalogItem({
              name: item.displayName,
              category: item.categoryKey,
              unit: item.unit,
            });
            if (!resolved) {
              throw new Error('Unable to resolve pantry item.');
            }
            await adjustStock({
              catalogItemId: resolved.id,
              quantityDelta: item.quantity ?? 1,
              unit: item.unit,
              sourceType: 'pantry_scan_seed',
              reason: `Pantry photo review (${item.rawLabel})`,
            });
            setPhotoReviewItems((current) => current.filter((candidate) => candidate.rawLabel !== item.rawLabel));
          } catch (err) {
            Alert.alert('Unable to apply pantry item', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
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
  banner: {
    gap: 10,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  bannerCopy: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  bannerMeta: {
    color: colors.textSecondary.light,
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
  predictionCard: {
    gap: 6,
    borderColor: colors.accent.light,
  },
  predictionTitle: {
    color: colors.accent.light,
    fontWeight: '700',
  },
  predictionBody: {
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
});
