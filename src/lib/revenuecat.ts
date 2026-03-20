import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { RC_APPLE_KEY, RC_GOOGLE_KEY } from '@/constants/config';

export async function initRevenueCat(userId: string): Promise<void> {
  // RevenueCat is only supported on iOS and Android (not web)
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  }

  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: RC_APPLE_KEY, appUserID: userId });
  } else if (Platform.OS === 'android') {
    Purchases.configure({ apiKey: RC_GOOGLE_KEY, appUserID: userId });
  }
}

export interface Entitlements {
  isPlus: boolean;
  isPro: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
}

export async function getEntitlements(): Promise<Entitlements> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const { entitlements } = customerInfo;
    const plusEntitlement = entitlements.active['plus'];
    const proEntitlement = entitlements.active['pro'];

    return {
      isPlus: plusEntitlement !== undefined,
      isPro: proEntitlement !== undefined,
      isTrial:
        plusEntitlement?.periodType === 'TRIAL' ||
        proEntitlement?.periodType === 'TRIAL',
      trialDaysRemaining: calculateTrialDays(plusEntitlement ?? proEntitlement),
    };
  } catch {
    // RevenueCat not configured or not available (e.g., on web or dev without keys)
    return { isPlus: false, isPro: false, isTrial: false, trialDaysRemaining: 0 };
  }
}

export async function hasPlusEntitlement(): Promise<boolean> {
  const { isPlus, isPro } = await getEntitlements();
  return isPlus || isPro;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateTrialDays(entitlement: any): number {
  if (!entitlement?.expirationDate) return 0;
  const diff = new Date(entitlement.expirationDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
