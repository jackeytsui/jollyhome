import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { DietaryTag, DIETARY_OPTIONS } from '@/components/household/DietaryTag';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/constants/theme';

export default function ProfileSettingsScreen() {
  const { user } = useAuthStore();
  const { profile, loadProfile, updateProfile, uploadAvatar, isLoading } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setSelectedPrefs(profile.dietary_preferences ?? []);
      setDietaryNotes(profile.dietary_notes ?? '');
    }
  }, [profile]);

  function togglePref(pref: string) {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  async function handleChangePhoto() {
    Alert.alert('Change Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            try {
              await uploadAvatar(result.assets[0].uri);
            } catch {
              Alert.alert('Error', 'Failed to upload photo. Please try again.');
            }
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            try {
              await uploadAvatar(result.assets[0].uri);
            } catch {
              Alert.alert('Error', 'Failed to upload photo. Please try again.');
            }
          }
        },
      },
      {
        text: 'Use Initials',
        onPress: async () => {
          await updateProfile({ avatar_url: null, avatar_type: 'initials' });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || null,
        dietary_preferences: selectedPrefs,
        dietary_notes: dietaryNotes.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const initials = (profile?.display_name ?? user?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Your Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={profile?.avatar_url ?? undefined}
            initials={initials}
            size="lg"
          />
          <Pressable onPress={handleChangePhoto} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>

        {/* Display Name */}
        <View style={styles.field}>
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How should we call you?"
            autoCapitalize="words"
          />
        </View>

        {/* Dietary Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dietary Preferences</Text>
          <View style={styles.tagsGrid}>
            {DIETARY_OPTIONS.map((option) => (
              <DietaryTag
                key={option}
                label={option}
                selected={selectedPrefs.includes(option)}
                onPress={() => togglePref(option)}
              />
            ))}
          </View>
        </View>

        {/* Dietary Notes */}
        <View style={styles.field}>
          <Input
            label="Additional notes"
            value={dietaryNotes}
            onChangeText={setDietaryNotes}
            placeholder="Any other dietary info..."
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.saveButton}>
          <Button
            label="Save"
            variant="primary"
            onPress={handleSave}
            loading={saving || isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  changePhotoButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 20,
  },
  field: {
    width: '100%',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -3,
  },
  saveButton: {
    marginTop: 8,
  },
});
