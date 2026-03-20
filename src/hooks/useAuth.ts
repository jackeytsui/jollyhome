import { useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const mapError = useCallback(
    (message: string): string => {
      if (
        message.includes('Invalid login credentials') ||
        message.includes('invalid_grant')
      ) {
        return t('error.authFailure');
      }
      if (
        message.includes('network') ||
        message.includes('NetworkError') ||
        message.includes('fetch')
      ) {
        return t('error.network');
      }
      return message;
    },
    [t]
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName: string
    ): Promise<{ user: import('@supabase/supabase-js').User | null; emailConfirmationRequired: boolean }> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        });
        if (sbError) throw sbError;
        const emailConfirmationRequired =
          !!data.user && !data.user.email_confirmed_at;
        return { user: data.user, emailConfirmationRequired };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(mapError(msg));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mapError]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (sbError) throw sbError;
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(mapError(msg));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mapError]
  );

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const emailRedirectTo = Linking.createURL('/');
        const { error: sbError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo },
        });
        if (sbError) throw sbError;
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(mapError(msg));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mapError]
  );

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const redirectTo = AuthSession.makeRedirectUri();
      const { data, error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (sbError) throw sbError;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );
        if (result.type === 'success') {
          await supabase.auth.exchangeCodeForSession(result.url);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(mapError(msg));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mapError]);

  const signInWithApple = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const redirectTo = AuthSession.makeRedirectUri();
      const { data, error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (sbError) throw sbError;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );
        if (result.type === 'success') {
          await supabase.auth.exchangeCodeForSession(result.url);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(mapError(msg));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mapError]);

  const resetPassword = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const redirectTo = Linking.createURL('/reset-password');
        const { error: sbError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo }
        );
        if (sbError) throw sbError;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(mapError(msg));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mapError]
  );

  const resendVerification = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { error: sbError } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (sbError) throw sbError;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(mapError(msg));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mapError]
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase.auth.signOut();
      if (sbError) throw sbError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(mapError(msg));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mapError]);

  return {
    signUpWithEmail,
    signInWithEmail,
    signInWithMagicLink,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    resendVerification,
    signOut,
    isLoading,
    error,
    clearError,
  };
}
