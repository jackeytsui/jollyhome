import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { captureEvent } from '@/lib/posthog';
import { colors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { resetPassword, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    try {
      await resetPassword(email);
      captureEvent('password_reset_requested');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.heading}>{t('auth.forgotPassword.heading')}</Text>
            <Text style={styles.body}>{t('auth.forgotPassword.body')}</Text>
          </View>

          {sent ? (
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationText}>
                {t('auth.forgotPassword.sentMessage')}
              </Text>
            </View>
          ) : (
            <>
              <Input
                label={t('auth.forgotPassword.emailLabel')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error ?? undefined}
              />
              <Button
                label={t('auth.forgotPassword.sendButton')}
                onPress={handleSend}
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
              />
            </>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
          >
            <Text style={styles.link}>{t('auth.forgotPassword.backToSignIn')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  confirmationBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: colors.success.light,
    borderRadius: 8,
    padding: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  backRow: {
    alignSelf: 'flex-start',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
});
