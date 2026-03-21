import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useSettlements } from '@/hooks/useSettlements';
import { useAuthStore } from '@/stores/auth';
import type { PaymentPreferences } from '@/types/expenses';

type AppKey = 'venmo' | 'cashapp' | 'paypal' | 'zelle';

interface AppOption {
  key: AppKey;
  label: string;
  placeholder: string;
  field: keyof PaymentPreferences;
}

const APP_OPTIONS: AppOption[] = [
  { key: 'venmo', label: 'Venmo', placeholder: 'Venmo username', field: 'venmo_username' },
  { key: 'cashapp', label: 'Cash App', placeholder: 'Cash App $cashtag', field: 'cashapp_username' },
  { key: 'paypal', label: 'PayPal', placeholder: 'PayPal email', field: 'paypal_email' },
  { key: 'zelle', label: 'Zelle', placeholder: 'Phone or email', field: 'zelle_identifier' },
];

export default function PaymentPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { paymentPrefs, loadPaymentPrefs, updatePaymentPrefs, loading } = useSettlements();

  const [preferredApp, setPreferredApp] = useState<AppKey | null>(null);
  const [identifiers, setIdentifiers] = useState<Record<AppKey, string>>({
    venmo: '',
    cashapp: '',
    paypal: '',
    zelle: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPaymentPrefs(user.id);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paymentPrefs) {
      setPreferredApp(paymentPrefs.preferred_app ?? null);
      setIdentifiers({
        venmo: paymentPrefs.venmo_username ?? '',
        cashapp: paymentPrefs.cashapp_username ?? '',
        paypal: paymentPrefs.paypal_email ?? '',
        zelle: paymentPrefs.zelle_identifier ?? '',
      });
    }
  }, [paymentPrefs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const prefs: Partial<PaymentPreferences> = {
        preferred_app: preferredApp,
        venmo_username: identifiers.venmo || null,
        cashapp_username: identifiers.cashapp || null,
        paypal_email: identifiers.paypal || null,
        zelle_identifier: identifiers.zelle || null,
      };
      const success = await updatePaymentPrefs(prefs);
      if (success) {
        Alert.alert('Saved', 'Payment preferences updated.');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to save payment preferences. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !paymentPrefs) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent.light} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Payment Preferences</Text>
        <Text style={styles.subheading}>
          Choose your preferred payment app so housemates can send you money quickly.
        </Text>

        {/* App selector cards */}
        <View style={styles.appGrid}>
          {APP_OPTIONS.map(({ key, label }) => {
            const isSelected = preferredApp === key;
            return (
              <Pressable
                key={key}
                style={[styles.appCard, isSelected && styles.appCardSelected]}
                onPress={() => setPreferredApp(isSelected ? null : key)}
                accessibilityLabel={`Select ${label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.appLabel, isSelected && styles.appLabelSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Identifier inputs for each app */}
        {APP_OPTIONS.map(({ key, label, placeholder }) => {
          const isSelected = preferredApp === key;
          return (
            <View key={key} style={[styles.inputGroup, !isSelected && styles.inputGroupHidden]}>
              <Text style={styles.inputLabel}>{label} handle</Text>
              <TextInput
                style={styles.textInput}
                value={identifiers[key]}
                onChangeText={(text) =>
                  setIdentifiers((prev) => ({ ...prev, [key]: text }))
                }
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary.light}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={key === 'paypal' || key === 'zelle' ? 'email-address' : 'default'}
                accessibilityLabel={placeholder}
              />
            </View>
          );
        })}

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel="Save payment preferences"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  loader: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appCard: {
    width: '47%',
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appCardSelected: {
    borderColor: colors.accent.light,
    backgroundColor: colors.dominant.light,
  },
  appLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  appLabelSelected: {
    color: colors.accent.light,
  },
  inputGroup: {
    gap: 6,
  },
  inputGroupHidden: {
    display: 'none',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 22,
    minHeight: 44,
  },
  saveButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
});
