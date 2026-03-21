import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { buildPaymentLink } from '@/lib/paymentLinks';
import type { PaymentPreferences } from '@/types/expenses';

interface PaymentApp {
  key: 'venmo' | 'cashapp' | 'paypal' | 'zelle';
  label: string;
  bgColor: string;
  getUsernameFromPrefs: (prefs: PaymentPreferences | null) => string | null;
}

const PAYMENT_APPS: PaymentApp[] = [
  {
    key: 'venmo',
    label: 'Venmo',
    bgColor: '#3D95CE',
    getUsernameFromPrefs: (prefs) => prefs?.venmo_username ?? null,
  },
  {
    key: 'cashapp',
    label: 'Cash App',
    bgColor: '#00C244',
    getUsernameFromPrefs: (prefs) => prefs?.cashapp_username ?? null,
  },
  {
    key: 'paypal',
    label: 'PayPal',
    bgColor: '#003087',
    getUsernameFromPrefs: (prefs) => prefs?.paypal_email ?? null,
  },
  {
    key: 'zelle',
    label: 'Zelle',
    bgColor: '#6D1ED4',
    getUsernameFromPrefs: (prefs) => prefs?.zelle_identifier ?? null,
  },
];

interface PaymentAppLinksProps {
  amountCents: number;
  note: string;
  recipientPrefs: PaymentPreferences | null;
  onSelectApp: (app: string) => void;
}

export function PaymentAppLinks({
  amountCents,
  note,
  recipientPrefs,
  onSelectApp,
}: PaymentAppLinksProps) {
  const preferredApp = recipientPrefs?.preferred_app ?? null;

  // Sort: preferred app first
  const sortedApps = [...PAYMENT_APPS].sort((a, b) => {
    if (a.key === preferredApp) return -1;
    if (b.key === preferredApp) return 1;
    return 0;
  });

  const handleAppPress = async (app: PaymentApp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const username = app.getUsernameFromPrefs(recipientPrefs);

    if (!username) {
      Alert.alert(
        `${app.label} Not Set Up`,
        `This person hasn't added their ${app.label} account. Ask them to add it in their payment settings.`
      );
      return;
    }

    const url = buildPaymentLink(app.key, username, amountCents, note);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          `Open ${app.label}`,
          `Could not open ${app.label} automatically.\n\nSend payment to: ${username}`
        );
      }
    } catch {
      Alert.alert(
        `Open ${app.label}`,
        `Send payment to: ${username}`
      );
    }

    onSelectApp(app.key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {sortedApps.map((app) => {
        const username = app.getUsernameFromPrefs(recipientPrefs);
        const isPreferred = app.key === preferredApp;
        const isNotSetUp = !username;

        return (
          <Pressable
            key={app.key}
            style={[
              styles.chip,
              { backgroundColor: app.bgColor },
              isPreferred && styles.preferredBorder,
              isNotSetUp && styles.notSetUp,
            ]}
            onPress={() => handleAppPress(app)}
            accessibilityLabel={`Pay with ${app.label}${isNotSetUp ? ' (not set up)' : ''}`}
          >
            <Text style={styles.chipLabel}>{app.label}</Text>
            {isNotSetUp && (
              <Text style={styles.notSetUpLabel}>Not set up</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  chip: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  preferredBorder: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notSetUp: {
    opacity: 0.5,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  notSetUpLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 14,
  },
});
