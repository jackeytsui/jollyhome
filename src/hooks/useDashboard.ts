import { useEffect, useMemo } from 'react';
import { useBalances } from '@/hooks/useBalances';
import { useCalendar } from '@/hooks/useCalendar';
import { useChores } from '@/hooks/useChores';
import { useExpenses } from '@/hooks/useExpenses';
import { useInventory } from '@/hooks/useInventory';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useMembers } from '@/hooks/useMembers';
import {
  buildFairnessOverview,
  buildHouseholdDashboard,
  buildMonthlyReport,
  buildSpendingInsights,
} from '@/lib/dashboard';
import { useHouseholdStore } from '@/stores/household';

export function useDashboard() {
  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const householdName = useHouseholdStore((state) => state.householdName);
  const { expenses } = useExpenses();
  const { netBalances, simplifiedDebts } = useBalances();
  const { items: calendarItems } = useCalendar();
  const { instances, completions } = useChores();
  const { lowStockAlerts } = useInventory();
  const { activeRequests } = useMaintenance();
  const { mealPlans } = useMealPlans();
  const { members, loadMembers } = useMembers(activeHouseholdId);

  useEffect(() => {
    if (activeHouseholdId) {
      loadMembers();
    }
  }, [activeHouseholdId, loadMembers]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members]
  );

  const dashboard = useMemo(
    () => buildHouseholdDashboard({
      householdName,
      simplifiedDebts,
      openChoreCount: instances.filter((instance) => instance.status === 'open' || instance.status === 'claimed').length,
      upcomingCalendarCount: calendarItems.length,
      lowStockCount: lowStockAlerts.length,
      activeMaintenanceCount: activeRequests.length,
      plannedMealCount: mealPlans.filter((meal) => meal.status === 'planned').length,
    }),
    [activeRequests.length, calendarItems.length, householdName, instances, lowStockAlerts.length, mealPlans, simplifiedDebts]
  );

  const fairness = useMemo(() => {
    if (!activeHouseholdId) {
      return {
        headline: 'Shared fairness across labor and money',
        supporting: 'Choose a household to compare contribution signals.',
        members: [],
      };
    }

    return buildFairnessOverview({
      householdId: activeHouseholdId,
      members: activeMembers.map((member) => ({
        userId: member.user_id,
        displayName: member.profile.display_name ?? 'Housemate',
      })),
      completions: completions.map((completion) => ({
        householdId: completion.household_id,
        templateId: completion.template_id,
        completedBy: completion.completed_by,
        completedAt: completion.completed_at,
        actualMinutes: completion.actual_minutes,
      })),
      netBalances,
    });
  }, [activeHouseholdId, activeMembers, completions, netBalances]);

  const monthlyReport = useMemo(
    () => buildMonthlyReport({
      expenses,
      completions: completions.map((completion) => ({
        householdId: completion.household_id,
        templateId: completion.template_id,
        completedBy: completion.completed_by,
        completedAt: completion.completed_at,
        actualMinutes: completion.actual_minutes,
      })),
      mealPlans,
      lowStockAlerts,
      calendarItems,
      maintenanceRequests: activeRequests,
    }),
    [activeRequests, calendarItems, completions, expenses, lowStockAlerts, mealPlans]
  );

  const spendingInsights = useMemo(
    () => buildSpendingInsights({ expenses }),
    [expenses]
  );

  return {
    dashboard,
    fairness,
    monthlyReport,
    spendingInsights,
  };
}
