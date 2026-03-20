import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HouseholdHeader } from '@/components/household/HouseholdHeader';
import { InviteSheet } from '@/components/household/InviteSheet';
import { useHousehold } from '@/hooks/useHousehold';
import { useHouseholdStore } from '@/stores/household';
import { colors } from '@/constants/theme';

const FEATURE_PLACEHOLDERS = [
  { key: 'finances', label: 'Finances', description: 'Track shared expenses and balances.' },
  { key: 'chores', label: 'Chores', description: 'Manage household tasks fairly.' },
  { key: 'calendar', label: 'Calendar', description: 'Coordinate schedules together.' },
  { key: 'shopping', label: 'Shopping', description: 'Shared shopping lists.' },
  { key: 'meals', label: 'Meals', description: 'Plan meals for the week.' },
];

export default function HouseholdHomeScreen() {
  const { t } = useTranslation();
  const { loadActiveHousehold, isLoading } = useHousehold();
  const { activeHouseholdId, householdName, memberCount } = useHouseholdStore();
  const inviteSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    loadActiveHousehold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <SafeAreaView style={[styles.flex, styles.bgDominant]}>
      <HouseholdHeader
        householdName={householdName ?? ''}
        memberCount={memberCount}
        onInvitePress={handleInvitePress}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Solo empty state */}
        {isSolo ? (
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
          </Card>
        ) : null}

        {/* Feature placeholder cards */}
        <Text style={styles.sectionLabel}>Features</Text>
        {FEATURE_PLACEHOLDERS.map((feature) => (
          <Card key={feature.key} style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            </View>
          </Card>
        ))}
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
  comingSoonBadge: {
    backgroundColor: colors.secondary.light,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
});
