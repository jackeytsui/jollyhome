import '../../global.css';
import '@/lib/i18n';
import { useEffect } from 'react';
import { ActivityIndicator, Appearance, Platform, useColorScheme, View } from 'react-native';
import { Stack, Redirect, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function RootLayoutInner() {
  const { session, isLoading, setSession } = useAuthStore();
  const { themeOverride } = useSettingsStore();
  const systemScheme = useColorScheme();
  const pathname = usePathname();
  const allowPublicWebRoute =
    Platform.OS === 'web' && (pathname === '/landing' || pathname === '/terms');

  useEffect(() => {
    if (Platform.OS === 'web' || typeof Appearance.setColorScheme !== 'function') {
      return;
    }

    if (themeOverride === 'system') {
      Appearance.setColorScheme(systemScheme ?? 'light');
    } else {
      Appearance.setColorScheme(themeOverride);
    }
  }, [systemScheme, themeOverride]);

  useEffect(() => {
    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.dominant.light,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent.light} />
      </View>
    );
  }

  return (
    <>
      {!session && !allowPublicWebRoute && <Redirect href={Platform.OS === 'web' ? '/landing' : '/(auth)/sign-in'} />}
      {session && <Redirect href="/(app)" />}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <RootLayoutInner />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
