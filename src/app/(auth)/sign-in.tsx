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
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { captureEvent } from '@/lib/posthog';
import { colors } from '@/constants/theme';
import { INVITE_ONLY_BETA } from '@/constants/config';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInWithEmail, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    try {
      await signInWithEmail(email, password);
      captureEvent('sign_in', { method: 'email' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (returnTo) {
        router.replace(returnTo as Parameters<typeof router.replace>[0]);
      } else {
        router.replace('/(app)');
      }
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
          <Text style={styles.heading}>{t('auth.signIn.heading')}</Text>

          {INVITE_ONLY_BETA ? (
            <View style={styles.betaBanner}>
              <Text style={styles.betaTitle}>Private tester access</Text>
              <Text style={styles.betaBody}>
                New accounts are currently created through beta invite codes only. Existing testers can still sign in here.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label={t('auth.signIn.emailLabel')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.signIn.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label={t('auth.signIn.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.signIn.passwordPlaceholder')}
              secureTextEntry
              autoComplete="current-password"
              error={error ?? undefined}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotRow}
          >
            <Text style={styles.link}>{t('auth.signIn.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button
            label={t('cta.signIn')}
            onPress={handleSignIn}
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/magic-link')}
              style={styles.linkRow}
            >
              <Text style={styles.link}>{t('auth.signIn.magicLinkPrompt')}</Text>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={styles.footerText}>{t('auth.signIn.noAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.link}>{t('auth.signIn.getStartedLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    gap: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 28,
  },
  form: {
    gap: 16,
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
  forgotRow: {
    alignSelf: 'flex-end',
  },
  footer: {
    gap: 12,
    alignItems: 'center',
    paddingBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary.light,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
});
