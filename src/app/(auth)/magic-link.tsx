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
import { INVITE_ONLY_BETA } from '@/constants/config';

export default function MagicLinkScreen() {
  const { t } = useTranslation();
  const { signInWithMagicLink, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    try {
      await signInWithMagicLink(email);
      captureEvent('magic_link_sent');
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
          <Text style={styles.heading}>{t('auth.magicLink.heading')}</Text>

          {INVITE_ONLY_BETA ? (
            <View style={styles.betaBanner}>
              <Text style={styles.betaTitle}>Existing tester sign-in only</Text>
              <Text style={styles.betaBody}>
                Magic links are available for testers who already have accounts. New accounts still require a beta access code on the sign-up screen.
              </Text>
            </View>
          ) : null}

          {sent ? (
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationText}>
                {t('auth.magicLink.sentMessage', { email })}
              </Text>
              <Button
                label={t('common.resend')}
                onPress={handleSend}
                variant="secondary"
                loading={isLoading}
                disabled={isLoading}
              />
            </View>
          ) : (
            <>
              <Input
                label={t('auth.magicLink.emailLabel')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.magicLink.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error ?? undefined}
              />
              <Button
                label={t('auth.magicLink.sendButton')}
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
            <Text style={styles.link}>{t('auth.magicLink.backToSignIn')}</Text>
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
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 28,
  },
  betaBanner: {
    gap: 6,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  betaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  betaBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary.light,
  },
  confirmationBox: {
    gap: 16,
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
