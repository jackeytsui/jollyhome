import { useMemo, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { buildOnboardingSteps } from '@/lib/onboarding';

const storage = createMMKV({ id: 'home-onboarding' });

export function useOnboarding(input: {
  householdId: string | null;
  householdName: string | null;
  memberCount: number;
  timelineCount: number;
  plannedMealCount: number;
  lowStockCount: number;
  activeMaintenanceCount: number;
  hasExpenses: boolean;
  hasChores: boolean;
}) {
  const storageKey = input.householdId ? `home-onboarding:${input.householdId}` : null;
  const [dismissed, setDismissed] = useState<boolean>(() => (
    storageKey ? storage.getBoolean(storageKey) ?? false : true
  ));

  const steps = useMemo(
    () => buildOnboardingSteps({
      householdName: input.householdName,
      memberCount: input.memberCount,
      timelineCount: input.timelineCount,
      plannedMealCount: input.plannedMealCount,
      lowStockCount: input.lowStockCount,
      activeMaintenanceCount: input.activeMaintenanceCount,
      hasExpenses: input.hasExpenses,
      hasChores: input.hasChores,
    }),
    [
      input.activeMaintenanceCount,
      input.hasChores,
      input.hasExpenses,
      input.householdName,
      input.lowStockCount,
      input.memberCount,
      input.plannedMealCount,
      input.timelineCount,
    ]
  );

  function markSeen() {
    if (storageKey) {
      storage.set(storageKey, true);
    }
    setDismissed(true);
  }

  function reset() {
    if (storageKey) {
      storage.remove(storageKey);
    }
    setDismissed(false);
  }

  const shouldShow = Boolean(input.householdId) && !dismissed && (
    input.memberCount <= 2 || input.timelineCount === 0 || (!input.hasExpenses && !input.hasChores)
  );

  return {
    steps,
    shouldShow,
    markSeen,
    reset,
  };
}
