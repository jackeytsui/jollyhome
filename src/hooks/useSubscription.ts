import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getEntitlements } from '@/lib/revenuecat';
import { useAuthStore } from '@/stores/auth';
import { FREE_TIER_AI_CREDITS } from '@/constants/config';

export type SubscriptionTier = 'free' | 'plus' | 'pro';

export interface AiCredits {
  used: number;
  total: number;
  percentUsed: number;
}

export function useSubscription() {
  const { user } = useAuthStore();

  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [aiCredits, setAiCredits] = useState<AiCredits>({
    used: 0,
    total: FREE_TIER_AI_CREDITS,
    percentUsed: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const entitlements = await getEntitlements();
      if (entitlements.isPro) {
        setTier('pro');
      } else if (entitlements.isPlus) {
        setTier('plus');
      } else {
        setTier('free');
      }
      setIsTrial(entitlements.isTrial);
      setTrialDaysRemaining(entitlements.trialDaysRemaining);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAiCredits = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_credits')
        .select('credits_used, credits_total')
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString())
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No record for this period — use defaults (50 credits)
        setAiCredits({
          used: 0,
          total: FREE_TIER_AI_CREDITS,
          percentUsed: 0,
        });
        return;
      }

      const percentUsed = Math.round((data.credits_used / data.credits_total) * 100);
      setAiCredits({
        used: data.credits_used,
        total: data.credits_total,
        percentUsed,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const showPaywall = useCallback(async () => {
    // react-native-purchases-ui is not yet installed.
    // Fallback: open App Store / Play Store subscription management.
    // When react-native-purchases-ui is added, replace with:
    //   import { presentPaywallIfNeeded } from 'react-native-purchases-ui';
    //   await presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'plus' });
    Alert.alert(
      'Upgrade to Plus',
      'Unlock more members, households, and AI credits. Manage subscriptions in App Store / Play Store settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Manage Subscriptions',
          onPress: () => {
            // iOS: open subscription management page
            Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {
              // Fallback for Android or web
              Linking.openURL('https://play.google.com/store/account/subscriptions').catch(() => {
                // No-op on web / unsupported platform
              });
            });
          },
        },
      ]
    );
  }, []);

  return {
    tier,
    isTrial,
    trialDaysRemaining,
    aiCredits,
    loadSubscription,
    loadAiCredits,
    showPaywall,
    isLoading,
  };
}
