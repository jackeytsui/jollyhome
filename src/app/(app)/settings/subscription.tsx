import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CreditMeter } from '@/components/paywall/CreditMeter';
import { useSubscription } from '@/hooks/useSubscription';
import { colors } from '@/constants/theme';

const TIER_FEATURES = {
  free: {
    label: 'Free',
    members: '6 members',
    households: '1 household',
    credits: '50 AI credits/month',
  },
  plus: {
    label: 'Plus',
    members: '12 members',
    households: '3 households',
    credits: '200 AI credits/month',
  },
  pro: {
    label: 'Pro',
    members: 'Unlimited members',
    households: 'Unlimited households',
    credits: '1,000 AI credits/month',
  },
} as const;

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const {
    tier,
    isTrial,
    trialDaysRemaining,
    aiCredits,
    loadSubscription,
    loadAiCredits,
    showPaywall,
    isLoading,
  } = useSubscription();

  useEffect(() => {
    loadSubscription();
    loadAiCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTierFeatures = TIER_FEATURES[tier];

  return (
    <SafeAreaView style={[styles.flex, styles.bgDominant]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Subscription & AI Credits</Text>

        {/* Current Plan */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={styles.tierRow}>
            <Badge variant="tier" label={tier} />
            {isTrial ? (
              <Text style={styles.trialText}>
                {t('trial.active', { days: trialDaysRemaining })}
              </Text>
            ) : null}
          </View>

          {tier === 'free' && !isTrial ? (
            <Text style={styles.bodyText}>
              You're on the free plan. Upgrade to Plus or Pro to unlock more members, households, and AI credits.
            </Text>
          ) : null}

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• {currentTierFeatures.members}</Text>
            <Text style={styles.featureItem}>• {currentTierFeatures.households}</Text>
            <Text style={styles.featureItem}>• {currentTierFeatures.credits}</Text>
          </View>
        </Card>

        {/* AI Credits */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>AI Credits</Text>
          {isLoading ? (
            <Text style={styles.bodyText}>{t('common.loading')}</Text>
          ) : (
            <CreditMeter
              used={aiCredits.used}
              total={aiCredits.total}
              percentUsed={aiCredits.percentUsed}
            />
          )}
          <View style={styles.buyMoreButton}>
            <Button
              label="Buy More Credits"
              variant="ghost"
              onPress={() => {
                // Placeholder — pay-per-use credit purchase to be implemented in a later phase
              }}
            />
          </View>
        </Card>

        {/* Upgrade CTA */}
        {tier === 'free' ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Upgrade to Plus</Text>
            <Text style={styles.bodyText}>
              Unlock everything Jolly Home has to offer.
            </Text>

            {/* Feature comparison */}
            <View style={styles.comparisonTable}>
              {(['free', 'plus', 'pro'] as const).map((t_key) => (
                <View key={t_key} style={[styles.comparisonRow, t_key === tier ? styles.comparisonRowActive : undefined]}>
                  <View style={styles.comparisonTier}>
                    <Badge variant="tier" label={t_key} />
                  </View>
                  <View style={styles.comparisonFeatures}>
                    <Text style={styles.comparisonFeature}>{TIER_FEATURES[t_key].members}</Text>
                    <Text style={styles.comparisonFeature}>{TIER_FEATURES[t_key].households}</Text>
                    <Text style={styles.comparisonFeature}>{TIER_FEATURES[t_key].credits}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.upgradeButton}>
              <Button
                label="Upgrade to Plus"
                variant="primary"
                onPress={showPaywall}
              />
            </View>
          </Card>
        ) : null}

        {/* Subscription Management — for paid users */}
        {tier !== 'free' ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Manage Subscription</Text>
            <Text style={styles.bodyText}>
              Update or cancel your subscription through your device's app store.
            </Text>
            <View style={styles.manageButton}>
              <Button
                label="Manage Subscription"
                variant="ghost"
                onPress={showPaywall}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>
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
  content: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    marginBottom: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  trialText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.accent.light,
    lineHeight: 20,
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  featureList: {
    gap: 4,
  },
  featureItem: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  buyMoreButton: {
    marginTop: 4,
  },
  comparisonTable: {
    gap: 8,
    marginTop: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  comparisonRowActive: {
    borderColor: colors.accent.light,
    backgroundColor: '#FFF4ED',
  },
  comparisonTier: {
    width: 48,
    paddingTop: 2,
  },
  comparisonFeatures: {
    flex: 1,
    gap: 2,
  },
  comparisonFeature: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  upgradeButton: {
    marginTop: 4,
  },
  manageButton: {
    marginTop: 4,
  },
});
