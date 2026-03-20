import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

interface CreditMeterProps {
  used: number;
  total: number;
  percentUsed: number;
}

function getFillColor(percentUsed: number): string {
  if (percentUsed >= 100) return colors.destructive.light;
  if (percentUsed >= 90) return colors.sandbox.light;
  return colors.accent.light;
}

export function CreditMeter({ used, total, percentUsed }: CreditMeterProps) {
  const { t } = useTranslation();
  const fillColor = getFillColor(percentUsed);
  const clampedPercent = Math.min(percentUsed, 100);

  return (
    <View style={styles.container}>
      {/* Progress bar track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clampedPercent}%`, backgroundColor: fillColor },
          ]}
        />
      </View>

      {/* Usage label */}
      <Text style={styles.label}>
        {used} / {total} credits used this month
      </Text>

      {/* Warning messages */}
      {percentUsed >= 100 ? (
        <Text style={[styles.warning, { color: colors.destructive.light }]}>
          {t('credits.warning100')}
        </Text>
      ) : percentUsed >= 90 ? (
        <Text style={[styles.warning, { color: colors.sandbox.light }]}>
          {t('credits.warning90')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height: 8,
    backgroundColor: colors.secondary.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 20,
    marginTop: 6,
  },
  warning: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 6,
  },
});
