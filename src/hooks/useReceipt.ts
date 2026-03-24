import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  stageGroceryReceiptReview,
  stageRepairReceiptReview,
  isLikelyGroceryReceipt,
  isLikelyRepairReceipt,
} from '@/lib/receiptWorkflow';
import { supabase } from '@/lib/supabase';
import { useHouseholdStore } from '@/stores/household';
import { useAuthStore } from '@/stores/auth';
import type { FoodCatalogItem, InventoryUnit } from '@/types/inventory';
import type { MaintenanceRequest } from '@/types/maintenance';
import type { ShoppingCategoryKey } from '@/types/shopping';
import type { GroceryReceiptReview, ReceiptShoppingCandidate, RepairReceiptReview } from '@/lib/receiptWorkflow';

// ============================================================
// Types
// ============================================================

export interface ReceiptItem {
  name: string;
  price_cents: number;
  classification: 'shared' | 'personal';
  suggested_owner: string | null;
}

export interface ReceiptData {
  store_name: string;
  date: string | null;
  items: ReceiptItem[];
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
}

// ============================================================
// useReceipt hook
// Handles image capture, gallery pick, multi-page upload,
// Edge Function invocation, and state management.
// ============================================================

export function useReceipt() {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [receiptStoragePaths, setReceiptStoragePaths] = useState<string[]>([]);
  const [groceryReview, setGroceryReview] = useState<GroceryReceiptReview | null>(null);
  const [repairReview, setRepairReview] = useState<RepairReceiptReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();

  const hydrateGroceryReview = useCallback(async (parsed: ReceiptData, storagePaths: string[]) => {
    if (!activeHouseholdId) {
      setGroceryReview(null);
      setRepairReview(null);
      return;
    }

    if (!isLikelyGroceryReceipt(parsed)) {
      setGroceryReview(null);
    } else {
      const [catalogResult, shoppingResult] = await Promise.all([
        supabase
          .from('food_catalog_items')
          .select('id, household_id, canonical_name, display_name, normalized_name, barcode, category_key, default_unit, synonyms, source, created_at, updated_at')
          .or(`household_id.eq.${activeHouseholdId},household_id.is.null`)
          .order('display_name', { ascending: true }),
        supabase
          .from('shopping_list_items')
          .select('id, title, category_key, unit, catalog_item_id, status')
          .eq('household_id', activeHouseholdId)
          .eq('status', 'pending'),
      ]);

      if (catalogResult.error) {
        throw catalogResult.error;
      }
      if (shoppingResult.error) {
        throw shoppingResult.error;
      }

      const catalogItems: FoodCatalogItem[] = (catalogResult.data ?? []).map((row: {
        id: string;
        household_id: string | null;
        canonical_name: string;
        display_name: string;
        normalized_name: string;
        barcode: string | null;
        category_key: ShoppingCategoryKey;
        default_unit: InventoryUnit;
        synonyms: string[] | null;
        source: FoodCatalogItem['source'];
        created_at: string;
        updated_at: string;
      }) => ({
        id: row.id,
        householdId: row.household_id,
        canonicalName: row.canonical_name,
        displayName: row.display_name,
        normalizedName: row.normalized_name,
        barcode: row.barcode,
        category: row.category_key,
        defaultUnit: row.default_unit,
        synonyms: row.synonyms ?? [],
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const shoppingItems: ReceiptShoppingCandidate[] = (shoppingResult.data ?? []).map((row: {
        id: string;
        title: string;
        category_key: ShoppingCategoryKey;
        unit: string | null;
        catalog_item_id: string | null;
        status: 'pending' | 'purchased' | 'skipped';
      }) => ({
        id: row.id,
        title: row.title,
        category: row.category_key,
        unit: row.unit,
        catalogItemId: row.catalog_item_id,
        status: row.status,
      }));

      setGroceryReview(stageGroceryReceiptReview({
        receiptData: parsed,
        householdId: activeHouseholdId,
        storagePaths,
        catalog: catalogItems,
        shoppingItems,
      }));
    }

    if (!isLikelyRepairReceipt(parsed)) {
      setRepairReview(null);
      return;
    }

    const { data: maintenanceResult, error: maintenanceError } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('household_id', activeHouseholdId)
      .order('updated_at', { ascending: false });

    if (maintenanceError) {
      throw maintenanceError;
    }

    const maintenanceRequests: MaintenanceRequest[] = ((maintenanceResult ?? []) as Array<{
      id: string;
      household_id: string;
      created_by: string;
      title: string;
      description: string | null;
      area: string | null;
      priority: MaintenanceRequest['priority'];
      status: MaintenanceRequest['status'];
      claimed_by: string | null;
      claimed_at: string | null;
      resolved_at: string | null;
      cost_cents: number | string | null;
      latest_note: string | null;
      latest_photo_path: string | null;
      appointment_event_id: string | null;
      created_at: string;
      updated_at: string;
    }>).map((row) => ({
      id: row.id,
      householdId: row.household_id,
      createdBy: row.created_by,
      title: row.title,
      description: row.description,
      area: row.area,
      priority: row.priority,
      status: row.status,
      claimedBy: row.claimed_by,
      claimedAt: row.claimed_at,
      resolvedAt: row.resolved_at,
      costCents: typeof row.cost_cents === 'number' ? row.cost_cents : row.cost_cents ? Number(row.cost_cents) : null,
      latestNote: row.latest_note,
      latestPhotoPath: row.latest_photo_path,
      appointmentEventId: row.appointment_event_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    setRepairReview(stageRepairReceiptReview({
      receiptData: parsed,
      householdId: activeHouseholdId,
      storagePaths,
      maintenanceRequests,
    }));
  }, [activeHouseholdId]);

  /**
   * Add a single captured image URI (replaces the list for single-page flow).
   */
  const captureImage = useCallback((uri: string) => {
    setImages([uri]);
    setError(null);
  }, []);

  /**
   * Open the image library and add the selected image URI.
   */
  const pickFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImages((prev) => (prev.length === 0 ? [uri] : [...prev, uri]));
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open gallery';
      setError(message);
    }
  }, []);

  /**
   * Append a new page URI (multi-page receipt support).
   */
  const addPage = useCallback((uri: string) => {
    setImages((prev) => [...prev, uri]);
    setError(null);
  }, []);

  /**
   * Remove an image at the given index.
   */
  const removePage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Upload all captured images to Supabase Storage, then call the
   * process-receipt Edge Function and populate receiptData state.
   * Target: < 4 seconds total (upload + OCR).
   */
  const processReceipt = useCallback(async () => {
    if (images.length === 0) {
      setError('No images to process. Capture at least one photo.');
      return;
    }

    if (!activeHouseholdId) {
      setError('No active household. Please join or create a household first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storage_paths: string[] = [];

      // Upload each image to Supabase Storage
      for (const imageUri of images) {
        // Generate a unique path under the household's receipts folder
        const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const storagePath = `receipts/${activeHouseholdId}/${uuid}.jpg`;

        // Fetch the image blob from the local URI
        const imageResponse = await fetch(imageUri);
        if (!imageResponse.ok) {
          throw new Error('Failed to read image file');
        }
        const blob = await imageResponse.blob();

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(storagePath, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        storage_paths.push(storagePath);
      }

      // Fetch member names for AI classification hints
      const { data: membersData } = await supabase
        .from('household_members')
        .select('profile:profiles(display_name)')
        .eq('household_id', activeHouseholdId)
        .eq('status', 'active');

      const member_names: string[] = ((membersData ?? []) as unknown as Array<{
        profile: { display_name: string | null } | null;
      }>)
        .map((m) =>
          m.profile?.display_name ?? null
        )
        .filter((name): name is string => name !== null);

      // Call the process-receipt Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('process-receipt', {
        body: { storage_paths, household_id: activeHouseholdId, member_names },
      });

      if (fnError) {
        throw new Error(fnError.message ?? 'Failed to process receipt');
      }

      // Check for application-level errors from the Edge Function
      if (data?.error) {
        if (data.error === 'Insufficient AI credits') {
          throw new Error('You have run out of AI credits. Please upgrade your plan to scan more receipts.');
        }
        throw new Error(data.error);
      }

      const parsed = data as ReceiptData;
      setReceiptData(parsed);
      setReceiptStoragePaths(storage_paths);
      await hydrateGroceryReview(parsed, storage_paths);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process receipt. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [images, activeHouseholdId, user]);

  /**
   * Reset all receipt state (images, data, error).
   */
  const clearReceipt = useCallback(() => {
    setImages([]);
    setReceiptData(null);
    setReceiptStoragePaths([]);
    setGroceryReview(null);
    setRepairReview(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    receiptData,
    images,
    receiptStoragePaths,
    groceryReview,
    repairReview,
    loading,
    error,
    captureImage,
    pickFromGallery,
    addPage,
    removePage,
    processReceipt,
    clearReceipt,
  };
}
