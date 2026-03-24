import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { DailyDigestPreview, NotificationReference } from '@/types/notifications';

interface DailyDigestPreviewCardProps {
  digest: DailyDigestPreview;
  onReferencePress: (reference: NotificationReference) => void;
}

export function DailyDigestPreviewCard(props: DailyDigestPreviewCardProps) {
  const { digest, onReferencePress } = props;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Daily digest</Text>
        </View>
        <Text style={styles.title}>{digest.headline}</Text>
        <Text style={styles.subtitle}>{digest.subheadline}</Text>
      </View>

      {digest.sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View
              style={[
                styles.countPill,
                section.tone === 'attention'
                  ? styles.countPillAttention
                  : section.tone === 'positive'
                    ? styles.countPillPositive
                    : null,
              ]}
            >
              <Text style={styles.countPillText}>{section.count}</Text>
            </View>
          </View>
          <Text style={styles.sectionSummary}>{section.summary}</Text>

          {section.references.slice(0, 2).map((reference) => (
            <Pressable
              key={`${section.id}-${reference.feature}-${reference.entityId ?? reference.title}`}
              onPress={() => onReferencePress(reference)}
              style={styles.referenceRow}
            >
              <View style={styles.referenceText}>
                <Text style={styles.referenceTitle}>{reference.title}</Text>
                {reference.subtitle ? (
                  <Text style={styles.referenceSubtitle}>{reference.subtitle}</Text>
                ) : null}
              </View>
              <Text style={styles.referenceChevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary.light,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  countPill: {
    minWidth: 28,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.dominant.light,
    alignItems: 'center',
  },
  countPillAttention: {
    backgroundColor: '#FEE2E2',
  },
  countPillPositive: {
    backgroundColor: '#DCFCE7',
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  sectionSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  referenceText: {
    flex: 1,
    gap: 2,
  },
  referenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  referenceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
  referenceChevron: {
    fontSize: 20,
    lineHeight: 22,
    color: colors.textSecondary.light,
    paddingLeft: 8,
  },
});
