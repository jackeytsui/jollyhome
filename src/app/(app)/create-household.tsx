import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useHousehold } from '@/hooks/useHousehold';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';

export default function CreateHouseholdScreen() {
  const { t } = useTranslation();
  const { createHousehold, isLoading } = useHousehold();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  function validateName(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return 'Household name is required.';
    if (trimmed.length < 2) return 'Name must be at least 2 characters.';
    if (trimmed.length > 50) return 'Name must be 50 characters or less.';
    return null;
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setIsUploadingPhoto(true);

    try {
      const fileName = `household-${Date.now()}.jpg`;
      const fileExt = asset.uri.split('.').pop() ?? 'jpg';
      const filePath = `${fileName}.${fileExt}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('household-avatars')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('household-avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);
    } catch (err) {
      console.warn('Failed to upload photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    const validation = validateName(trimmedName);
    if (validation) {
      setNameError(validation);
      return;
    }

    setNameError(null);

    try {
      await createHousehold(trimmedName, avatarUrl ?? undefined);
      router.replace('/(app)/(home)/');
    } catch (err) {
      console.warn('Failed to create household:', err);
    }
  }

  const initials = name.trim().charAt(0) || 'H';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Create Your Household</Text>

        {/* Photo picker */}
        <Pressable
          onPress={handlePickPhoto}
          style={styles.photoPicker}
          disabled={isUploadingPhoto}
        >
          {isUploadingPhoto ? (
            <View style={styles.photoPlaceholder}>
              <ActivityIndicator color={colors.accent.light} />
            </View>
          ) : (
            <View style={styles.photoWrapper}>
              <Avatar uri={avatarUrl ?? undefined} initials={initials} size="lg" />
              <View style={styles.cameraOverlay}>
                <Camera color="#FFFFFF" size={18} />
              </View>
            </View>
          )}
        </Pressable>

        <View style={styles.inputWrapper}>
          <Input
            label="Household Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(validateName(text));
            }}
            placeholder="e.g., The Johnson House"
            error={nameError ?? undefined}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.ctaWrapper}>
          <Button
            label={t('cta.createHousehold')}
            variant="primary"
            size="lg"
            onPress={handleCreate}
            loading={isLoading}
            disabled={isLoading || isUploadingPhoto}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    alignSelf: 'flex-start',
  },
  photoPicker: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    width: '100%',
  },
  ctaWrapper: {
    width: '100%',
    marginTop: 8,
  },
});
