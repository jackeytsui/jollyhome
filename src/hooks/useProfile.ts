import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_type: 'photo' | 'illustrated' | 'initials';
  dietary_preferences: string[];
  dietary_notes: string | null;
  biometric_enabled: boolean;
  theme_override: 'light' | 'dark' | 'system';
  language_override: string | null;
  active_household_id: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  async function loadProfile(): Promise<void> {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile({
        id: data.id,
        display_name: data.display_name ?? null,
        avatar_url: data.avatar_url ?? null,
        avatar_type: data.avatar_type ?? 'initials',
        dietary_preferences: data.dietary_preferences ?? [],
        dietary_notes: data.dietary_notes ?? null,
        biometric_enabled: data.biometric_enabled ?? false,
        theme_override: data.theme_override ?? 'system',
        language_override: data.language_override ?? null,
        active_household_id: data.active_household_id ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProfile(updates: Partial<Omit<Profile, 'id'>>): Promise<void> {
    if (!user) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadAvatar(uri: string): Promise<string> {
    if (!user) throw new Error('Not authenticated');

    const filename = `avatars/${user.id}/${Date.now()}.jpg`;

    // Fetch the image as a blob for upload
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    await updateProfile({ avatar_url: publicUrl, avatar_type: 'photo' });

    return publicUrl;
  }

  return {
    profile,
    loadProfile,
    updateProfile,
    uploadAvatar,
    isLoading,
    error,
  };
}
