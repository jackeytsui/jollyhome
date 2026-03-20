import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

interface SandboxBannerProps {
  onClear: () => void;
}

export function SandboxBanner({ onClear }: SandboxBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.message}>{t('sandbox.banner')}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear Demo Data</Text>
          </Pressable>
          <Pressable onPress={() => setDismissed(true)} style={styles.dismissButton} accessibilityLabel="Dismiss sandbox banner">
            <X size={16} color={colors.sandbox.light} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF9C3', // light yellow for sandbox indicator
    borderBottomWidth: 1,
    borderBottomColor: colors.sandbox.light,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.sandbox.light,
    lineHeight: 20,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.sandbox.light,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 4,
  },
});
