import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CoordinationEventSheet } from '@/components/rules/CoordinationEventSheet';
import { RuleAcknowledgementSheet } from '@/components/rules/RuleAcknowledgementSheet';
import { RuleEditorSheet } from '@/components/rules/RuleEditorSheet';
import { RuleVersionCard } from '@/components/rules/RuleVersionCard';
import { colors } from '@/constants/theme';
import { summarizeRuleAcknowledgements, useHouseRules } from '@/hooks/useHouseRules';
import { useMembers } from '@/hooks/useMembers';
import { useHouseholdStore } from '@/stores/household';

export function buildRulesSummary(versionCount: number, pendingCount: number) {
  return {
    headline: versionCount > 0 ? `${versionCount} rule versions on record` : 'No rules published yet',
    supporting:
      pendingCount > 0
        ? `${pendingCount} members still need to acknowledge the current version`
        : 'Everyone is up to date on the current version',
  };
}

export default function RulesScreen() {
  const [editorVisible, setEditorVisible] = useState(false);
  const [ackVisible, setAckVisible] = useState(false);
  const [coordinationVisible, setCoordinationVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const {
    versions,
    acknowledgements,
    currentVersion,
    loading,
    error,
    publishRuleVersion,
    acknowledgeCurrentVersion,
    createCoordinationEvent,
  } = useHouseRules();
  const { members, loadMembers } = useMembers(activeHouseholdId);

  useEffect(() => {
    if (activeHouseholdId) {
      loadMembers();
    }
  }, [activeHouseholdId, loadMembers]);

  const acknowledgementSummary = useMemo(
    () =>
      summarizeRuleAcknowledgements(
        currentVersion,
        acknowledgements,
        members.filter((member) => member.status === 'active')
      ),
    [acknowledgements, currentVersion, members]
  );

  const summary = useMemo(
    () => buildRulesSummary(versions.length, acknowledgementSummary.pending.length),
    [acknowledgementSummary.pending.length, versions.length]
  );

  async function handlePublishRuleVersion(input: {
    title: string;
    body: string;
    changeSummary?: string | null;
  }) {
    setSubmitting(true);

    try {
      await publishRuleVersion(input);
      setEditorVisible(false);
    } catch (submitError) {
      Alert.alert('House rules', submitError instanceof Error ? submitError.message : 'Failed to publish rule version');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcknowledge() {
    setSubmitting(true);

    try {
      await acknowledgeCurrentVersion();
      setAckVisible(false);
    } catch (submitError) {
      Alert.alert('House rules', submitError instanceof Error ? submitError.message : 'Failed to acknowledge rules');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCoordinationEvent(input: Parameters<typeof createCoordinationEvent>[0]) {
    setSubmitting(true);

    try {
      await createCoordinationEvent(input);
      setCoordinationVisible(false);
    } catch (submitError) {
      Alert.alert('Coordination', submitError instanceof Error ? submitError.message : 'Failed to save coordination event');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.hero}>
          <Text style={styles.eyebrow}>House rules and coordination</Text>
          <Text style={styles.headline}>{summary.headline}</Text>
          <Text style={styles.supporting}>{summary.supporting}</Text>
          <View style={styles.heroActions}>
            <Button label="Publish rules" onPress={() => setEditorVisible(true)} />
            <Button label="Acknowledge" variant="secondary" onPress={() => setAckVisible(true)} />
          </View>
        </Card>

        {error ? (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <Card style={styles.coordCard}>
          <Text style={styles.sectionTitle}>Calendar-backed coordination</Text>
          <Text style={styles.coordBody}>
            Quiet hours, guest notices, and shared-space bookings all feed the shared household calendar instead of living in a separate planner.
          </Text>
          <Button label="Add coordination event" variant="secondary" onPress={() => setCoordinationVisible(true)} />
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rule history</Text>
            <Text style={styles.sectionMeta}>{loading ? 'Loading...' : `${versions.length} versions`}</Text>
          </View>

          {versions.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>No rules published yet</Text>
              <Text style={styles.emptyBody}>Publish a first version so the household can acknowledge one shared source of expectations.</Text>
            </Card>
          ) : (
            versions.map((version) => {
              const acknowledgedCount = acknowledgements.filter(
                (acknowledgement) => acknowledgement.ruleVersionId === version.id && acknowledgement.acknowledgedAt
              ).length;
              const pendingCount = members.filter((member) => {
                if (member.status !== 'active') {
                  return false;
                }

                return !acknowledgements.some(
                  (acknowledgement) =>
                    acknowledgement.ruleVersionId === version.id &&
                    acknowledgement.memberId === member.user_id &&
                    acknowledgement.acknowledgedAt
                );
              }).length;

              return (
                <RuleVersionCard
                  key={version.id}
                  version={version}
                  acknowledgedCount={acknowledgedCount}
                  pendingCount={pendingCount}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      <RuleEditorSheet
        visible={editorVisible}
        loading={submitting}
        onClose={() => setEditorVisible(false)}
        onSubmit={handlePublishRuleVersion}
      />
      <RuleAcknowledgementSheet
        visible={ackVisible}
        acknowledgedCount={acknowledgementSummary.acknowledgedCount}
        pending={acknowledgementSummary.pending}
        loading={submitting}
        onClose={() => setAckVisible(false)}
        onAcknowledge={handleAcknowledge}
      />
      <CoordinationEventSheet
        visible={coordinationVisible}
        loading={submitting}
        onClose={() => setCoordinationVisible(false)}
        onSubmit={handleCreateCoordinationEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.accent.light,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary.light,
  },
  supporting: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  coordCard: {
    gap: 10,
  },
  coordBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  sectionMeta: {
    fontSize: 13,
    color: colors.textSecondary.light,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  errorText: {
    color: colors.destructive.light,
  },
});
