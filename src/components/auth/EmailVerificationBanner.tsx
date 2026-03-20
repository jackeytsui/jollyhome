import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

const RESEND_COOLDOWN_SECONDS = 60;

interface EmailVerificationBannerProps {
  email: string;
  onResend: () => void | Promise<void>;
}

export function EmailVerificationBanner({
  email,
  onResend,
}: EmailVerificationBannerProps) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setCountdown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, onResend]);

  return (
    <View style={styles.banner}>
      <Text style={styles.bodyText}>
        {t('error.emailNotVerified')}
      </Text>
      {email ? (
        <Text style={styles.emailText}>{email}</Text>
      ) : null}
      <TouchableOpacity
        onPress={handleResend}
        disabled={countdown > 0 || isResending}
        style={[styles.resendButton, (countdown > 0 || isResending) && styles.resendDisabled]}
      >
        <Text style={styles.resendText}>
          {countdown > 0
            ? `${t('common.resend')} (${countdown}s)`
            : t('common.resend')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: colors.sandbox.light,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    width: '100%',
  },
  bodyText: {
    fontSize: 14,
    color: '#713F12',
    lineHeight: 20,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#713F12',
    lineHeight: 20,
  },
  resendButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.sandbox.light,
    lineHeight: 20,
  },
});
