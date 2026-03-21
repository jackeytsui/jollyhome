import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useHouseholdStore } from '@/stores/household';
import { useAuthStore } from '@/stores/auth';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();

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

      const member_names: string[] = (membersData ?? [])
        .map((m: { profile: { display_name: string | null } | null }) =>
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
    setError(null);
    setLoading(false);
  }, []);

  return {
    receiptData,
    images,
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
