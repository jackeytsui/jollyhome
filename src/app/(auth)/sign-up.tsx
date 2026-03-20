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
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { useAuth } from '@/hooks/useAuth';
import { captureEvent } from '@/lib/posthog';
import { colors } from '@/constants/theme';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUpWithEmail, signInWithGoogle, signInWithApple, resendVerification, isLoading, error } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSignUp = async () => {
    setFieldError(null);
    if (!email || !password || !displayName) {
      setFieldError('Please fill in all fields.');
      return;
    }
    try {
      const result = await signUpWithEmail(email, password, displayName);
      captureEvent('sign_up', { method: 'email' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (returnTo) {
        router.replace(returnTo as Parameters<typeof router.replace>[0]);
        return;
      }

      if (result.emailConfirmationRequired) {
        setSubmittedEmail(email);
        setEmailConfirmRequired(true);
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleResendVerification = async () => {
    await resendVerification(submittedEmail);
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
            <Text style={styles.heading}>{t('auth.signUp.heading')}</Text>
            <Text style={styles.body}>{t('auth.signUp.body')}</Text>
          </View>

          {emailConfirmRequired ? (
            <EmailVerificationBanner
              email={submittedEmail}
              onResend={handleResendVerification}
            />
          ) : (
            <>
              <SocialAuthButtons
                onGooglePress={signInWithGoogle}
                onApplePress={signInWithApple}
                disabled={isLoading}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('common.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.form}>
                <Input
                  label={t('auth.signUp.displayNameLabel')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t('auth.signUp.displayNamePlaceholder')}
                  autoCapitalize="words"
                  autoComplete="name"
                />
                <Input
                  label={t('auth.signUp.emailLabel')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.signUp.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Input
                  label={t('auth.signUp.passwordLabel')}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.signUp.passwordPlaceholder')}
                  secureTextEntry
                  autoComplete="new-password"
                  error={fieldError ?? error ?? undefined}
                />
              </View>

              <Button
                label={t('cta.getStarted')}
                onPress={handleSignUp}
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
                  <Text style={styles.link}>{t('auth.signUp.magicLinkPrompt')}</Text>
                </TouchableOpacity>

                <View style={styles.linkRow}>
                  <Text style={styles.footerText}>{t('auth.signUp.alreadyHaveAccount')} </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                    <Text style={styles.link}>{t('auth.signUp.signInLink')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
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
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textSecondary.light,
  },
  form: {
    gap: 16,
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
