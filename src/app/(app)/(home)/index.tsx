import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DailyDigestPreviewCard } from '@/components/home/DailyDigestPreviewCard';
import { FairnessDashboardCard } from '@/components/home/FairnessDashboardCard';
import { HouseholdHeader } from '@/components/household/HouseholdHeader';
import { HouseholdDashboard } from '@/components/home/HouseholdDashboard';
import { InviteSheet } from '@/components/household/InviteSheet';
import { MonthlyReportCard } from '@/components/home/MonthlyReportCard';
import { NotificationPreferencesCard } from '@/components/home/NotificationPreferencesCard';
import { SpendingInsightCard } from '@/components/home/SpendingInsightCard';
import { SandboxBanner } from '@/components/household/SandboxBanner';
import { useBalances } from '@/hooks/useBalances';
import { useCalendar } from '@/hooks/useCalendar';
import { useChores } from '@/hooks/useChores';
import { useDashboard } from '@/hooks/useDashboard';
import { useHousehold } from '@/hooks/useHousehold';
import { useInventory } from '@/hooks/useInventory';
import { buildDailyDigestPreview, useNotifications } from '@/hooks/useNotifications';
import { useExpenses } from '@/hooks/useExpenses';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useSandbox } from '@/hooks/useSandbox';
import { useHouseholdStore } from '@/stores/household';
import type { NotificationReference } from '@/types/notifications';
import { colors } from '@/constants/theme';

const FEATURE_CARDS = [
  { key: 'finances', label: 'Finances', description: 'Track your personal expenses.', route: '/(app)/finances' as const },
  { key: 'chores', label: 'Chores', description: 'Manage your personal tasks.', route: '/(app)/chores' as const },
  { key: 'calendar', label: 'Calendar', description: 'View your schedule.', route: '/(app)/calendar' as const },
  { key: 'shopping', label: 'Shopping', description: 'Shared shopping lists.', route: '/(app)/shopping' as const },
  { key: 'meals', label: 'Meals', description: 'Plan meals for the week.', route: '/(app)/meals' as const },
];

export default function HouseholdHomeScreen() {
  const { t } = useTranslation();
  const { loadActiveHousehold, isLoading } = useHousehold();
  const { activeHouseholdId, householdName, memberCount } = useHouseholdStore();
  const inviteSheetRef = useRef<BottomSheetModal>(null);
  const { items: calendarItems } = useCalendar();
  const { templates, instances } = useChores();
  const { expenses } = useExpenses();
  const { simplifiedDebts } = useBalances();
  const { lowStockAlerts } = useInventory();
  const { mealPlans } = useMealPlans();
  const { activeRequests } = useMaintenance();
  const {
    dashboard,
    fairness,
    monthlyReport,
    spendingInsights,
  } = useDashboard();
  const { preferences, saving, updateCategoryMode, updateDigestTiming } = useNotifications();

  const {
    isSandboxActive,
    activateSandbox,
    deactivateSandbox,
    sandboxData,
    loadSandboxData,
    checkSandboxStatus,
  } = useSandbox();

  useEffect(() => {
    loadActiveHousehold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeHouseholdId) {
      checkSandboxStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouseholdId]);

  useEffect(() => {
    if (isSandboxActive && activeHouseholdId) {
      loadSandboxData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSandboxActive, activeHouseholdId]);

  function handleInvitePress() {
    inviteSheetRef.current?.present();
  }

  // Loading state
  if (isLoading && !activeHouseholdId) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.centered} />
      </SafeAreaView>
    );
  }

  // No active household — prompt to create one
  if (!activeHouseholdId) {
    return (
      <SafeAreaView style={[styles.flex, styles.bgDominant]}>
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <Card>
            <Text style={styles.emptyHeading}>{t('emptyState.noHousehold.heading')}</Text>
            <Text style={styles.emptyBody}>{t('emptyState.noHousehold.body')}</Text>
            <View style={styles.emptyAction}>
              <Button
                label={t('cta.createHousehold')}
                variant="primary"
                onPress={() => router.push('/(app)/create-household')}
              />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isSolo = memberCount <= 1;
  const urgentChores = instances
    .filter((instance) => instance.status === 'open' || instance.status === 'claimed')
    .map((instance) => {
      const template = templates.find((item) => item.id === instance.template_id);
      return {
        id: instance.id,
        title: template?.title ?? 'Chore',
        area: template?.area ?? 'Home',
      };
    })
    .slice(0, 3);
  const upcomingEvents = [...calendarItems]
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 3);
  const digestPreview = buildDailyDigestPreview({
    householdName,
    expenses: expenses.slice(0, 3),
    choreInstances: instances.map((instance) => ({
      id: instance.id,
      templateId: instance.template_id,
      status: instance.status,
      scheduledFor: instance.scheduled_for,
      dueWindowEnd: instance.due_window_end,
    })),
    choreTemplates: templates,
    calendarItems,
    mealPlans,
    lowStockAlerts,
    simplifiedDebts,
    maintenanceRequests: activeRequests,
  });

  function handleNotificationReferencePress(reference: NotificationReference) {
    router.push(reference.route);
  }

  function cycleDigestHour() {
    const nextHour = preferences ? (preferences.digestHour + 2) % 24 : 18;
    updateDigestTiming(nextHour).catch(() => {
      // Keep the last local state if the save fails.
    });
  }

  return (
    <SafeAreaView style={[styles.flex, styles.bgDominant]}>
      <HouseholdHeader
        householdName={householdName ?? ''}
        memberCount={memberCount}
        onInvitePress={handleInvitePress}
      />

      {/* Sandbox banner — shown when demo mode is active */}
      {isSandboxActive ? (
        <SandboxBanner onClear={deactivateSandbox} />
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sandbox demo content cards */}
        {isSandboxActive && sandboxData ? (
          <>
            {/* Recent Expenses */}
            {sandboxData.expenses.length > 0 ? (
              <Card style={styles.demoCard}>
                <Text style={styles.demoCardTitle}>Recent Expenses</Text>
                {sandboxData.expenses.slice(0, 3).map((expense, idx) => (
                  <View key={idx} style={styles.demoRow}>
                    <Text style={styles.demoItemLabel}>{expense.description}</Text>
                    <Text style={styles.demoItemValue}>${expense.amount.toFixed(2)}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {/* Chores Due */}
            {sandboxData.chores.length > 0 ? (
              <Card style={styles.demoCard}>
                <Text style={styles.demoCardTitle}>Chores Due</Text>
                {sandboxData.chores.slice(0, 3).map((chore, idx) => (
                  <View key={idx} style={styles.demoRow}>
                    <View style={[styles.conditionDot, styles[`condition_${chore.condition}`]]} />
                    <Text style={styles.demoItemLabel}>{chore.title}</Text>
                    <Text style={styles.demoItemMeta}>{chore.assigned_to}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {/* This Week's Meals */}
            {sandboxData.meals.length > 0 ? (
              <Card style={styles.demoCard}>
                <Text style={styles.demoCardTitle}>This Week's Meals</Text>
                {sandboxData.meals.slice(0, 3).map((meal, idx) => (
                  <View key={idx} style={styles.demoRow}>
                    <Text style={styles.demoItemLabel}>{meal.name}</Text>
                    <Text style={styles.demoItemMeta}>{meal.day}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {/* Upcoming Events */}
            {sandboxData.events.length > 0 ? (
              <Card style={styles.demoCard}>
                <Text style={styles.demoCardTitle}>Upcoming</Text>
                {sandboxData.events.slice(0, 2).map((event, idx) => (
                  <View key={idx} style={styles.demoRow}>
                    <Text style={styles.demoItemLabel}>{event.title}</Text>
                    <Text style={styles.demoItemMeta}>{event.date}</Text>
                  </View>
                ))}
              </Card>
            ) : null}
          </>
        ) : null}

        {/* Solo empty state */}
        {isSolo && !isSandboxActive ? (
          <Card style={styles.soloCard}>
            <Text style={styles.soloHeading}>{t('emptyState.solo.heading')}</Text>
            <Text style={styles.soloBody}>{t('emptyState.solo.body')}</Text>
            <View style={styles.soloAction}>
              <Button
                label={t('cta.shareInviteLink')}
                variant="primary"
                onPress={handleInvitePress}
              />
            </View>
            <View style={styles.demoButton}>
              <Button
                label="Explore with Demo Data"
                variant="secondary"
                onPress={activateSandbox}
              />
            </View>
          </Card>
        ) : null}

        {/* Quick Access feature cards — shown when not in sandbox mode */}
        {!isSandboxActive ? (
          <>
            <Text style={styles.sectionLabel}>Household Pulse</Text>
            <HouseholdDashboard
              summary={dashboard}
              onMetricPress={(route) => router.push(route)}
            />
            <DailyDigestPreviewCard
              digest={digestPreview}
              onReferencePress={handleNotificationReferencePress}
            />
            <FairnessDashboardCard fairness={fairness} />
            <MonthlyReportCard report={monthlyReport} />
            <SpendingInsightCard
              insights={spendingInsights}
              onInsightPress={(route) => router.push(route)}
            />
            <NotificationPreferencesCard
              preferences={preferences}
              saving={saving}
              onModeChange={(category, mode) => {
                updateCategoryMode(category, mode).catch(() => {
                  // Preserve optimistic UI state and surface errors later.
                });
              }}
              onDigestHourCycle={cycleDigestHour}
            />

            <Text style={styles.sectionLabel}>Tonight</Text>
            <Card style={styles.featureCard}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>Urgent chores</Text>
                <Text style={styles.featureDescription}>
                  {urgentChores.length > 0
                    ? urgentChores.map((chore) => `${chore.title} (${chore.area})`).join(' • ')
                    : 'No urgent chores are open right now.'}
                </Text>
              </View>
            </Card>

            <Card style={styles.featureCard}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>Upcoming events</Text>
                <Text style={styles.featureDescription}>
                  {upcomingEvents.length > 0
                    ? upcomingEvents.map((item) => item.title).join(' • ')
                    : 'Nothing upcoming on the household timeline yet.'}
                </Text>
              </View>
            </Card>

            <Text style={styles.sectionLabel}>Quick Access</Text>
            {FEATURE_CARDS.map((feature) => (
              <Pressable
                key={feature.key}
                onPress={() => router.push(feature.route)}
              >
                <Card style={styles.featureCard}>
                  <View style={styles.featureRow}>
                    <View style={styles.featureInfo}>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                    <View style={styles.chevron}>
                      <Text style={styles.chevronText}>›</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>

      {/* Invite sheet — rendered here so it can be presented from this screen */}
      {activeHouseholdId ? (
        <InviteSheet
          ref={inviteSheetRef}
          householdId={activeHouseholdId}
          householdName={householdName ?? ''}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bgDominant: {
    backgroundColor: colors.dominant.light,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  emptyAction: {
    marginTop: 16,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  soloCard: {
    marginBottom: 4,
  },
  soloHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    marginBottom: 8,
  },
  soloBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  soloAction: {
    marginTop: 16,
  },
  demoButton: {
    marginTop: 8,
  },
  demoCard: {
    marginBottom: 0,
  },
  demoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  demoItemLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  demoItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  demoItemMeta: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  conditionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  condition_green: {
    backgroundColor: colors.success.light,
  },
  condition_yellow: {
    backgroundColor: colors.sandbox.light,
  },
  condition_red: {
    backgroundColor: colors.destructive.light,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureCard: {
    marginBottom: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  chevron: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  chevronText: {
    fontSize: 22,
    color: colors.textSecondary.light,
    lineHeight: 26,
  },
});
