import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface OnboardingCardProps {
  heading: string;
  body: string;
  illustration?: React.ReactNode;
  isLast?: boolean;
  onContinue?: () => void;
}

export function OnboardingCard({
  heading,
  body,
  illustration,
  isLast = false,
  onContinue,
}: OnboardingCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.illustrationContainer}>
        {illustration ?? <View style={styles.illustrationPlaceholder} />}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {isLast && onContinue ? (
        <Button
          label={t('cta.continue')}
          onPress={onContinue}
          variant="primary"
          size="lg"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 24,
    backgroundColor: colors.accent.light,
    opacity: 0.2,
  },
  textContainer: {
    gap: 12,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 36,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
    textAlign: 'center',
  },
});
