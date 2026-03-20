import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  disabled?: boolean;
}

export function SocialAuthButtons({
  onGooglePress,
  onApplePress,
  disabled = false,
}: SocialAuthButtonsProps) {
  const { t } = useTranslation();

  const googleButton = (
    <Button
      key="google"
      label={t('social.google', 'Continue with Google')}
      onPress={onGooglePress}
      variant="secondary"
      disabled={disabled}
    />
  );

  const appleButton = (
    <Button
      key="apple"
      label={t('social.apple', 'Continue with Apple')}
      onPress={onApplePress}
      variant="secondary"
      disabled={disabled}
    />
  );

  // Apple HIG: show Apple first on iOS
  const buttons =
    Platform.OS === 'ios'
      ? [appleButton, googleButton]
      : [googleButton, appleButton];

  return <View style={styles.container}>{buttons}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
});
