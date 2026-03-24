import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface ChoreCardProps {
  chore: {
    id: string;
    title: string;
    assigneeNames: string[];
    area: string | null;
    estimatedMinutes: number;
    conditionProgress: number;
    conditionState: 'green' | 'yellow' | 'red';
    conditionLabel: string;
    status: 'open' | 'claimed' | 'completed' | 'skipped';
    kind: 'responsibility' | 'bonus';
  };
  warning?: {
    title: string;
    detail: string;
  } | null;
  onPress?: () => void;
  footer?: React.ReactNode;
}

const CONDITION_COLORS = {
  green: colors.success.light,
  yellow: colors.sandbox.light,
  red: colors.destructive.light,
} as const;

export function ChoreCard({ chore, warning = null, onPress, footer }: ChoreCardProps) {
  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} accessibilityLabel={`Edit chore ${chore.title}`}>
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{chore.title}</Text>
            <Text style={styles.assigneeText}>
              {chore.assigneeNames.join(', ')}
            </Text>
          </View>
          {chore.kind === 'bonus' ? (
            <View style={styles.kindBadge}>
              <Text style={styles.kindBadgeText}>Bonus</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{chore.area ?? 'Unassigned area'}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{chore.estimatedMinutes} min</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{chore.status}</Text>
        </View>

        <View style={styles.conditionBlock}>
          <View style={styles.conditionTrack}>
            <View
              style={[
                styles.conditionFill,
                {
                  width: `${Math.max(chore.conditionProgress * 100, 8)}%`,
                  backgroundColor: CONDITION_COLORS[chore.conditionState],
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.conditionLabel,
              { color: CONDITION_COLORS[chore.conditionState] },
            ]}
          >
            {chore.conditionLabel}
          </Text>
        </View>
      </Pressable>

      {warning ? (
        <View style={styles.warningBlock}>
          <Text style={styles.warningTitle}>{warning.title}</Text>
          <Text style={styles.warningDetail}>{warning.detail}</Text>
        </View>
      ) : null}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.textPrimary.light,
  },
  assigneeText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  kindBadge: {
    borderRadius: 999,
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  kindBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.light,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  metaDivider: {
    color: colors.border.light,
  },
  conditionBlock: {
    gap: 6,
    marginTop: 12,
  },
  conditionTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.dominant.light,
    borderRadius: 999,
    overflow: 'hidden',
  },
  conditionFill: {
    height: '100%',
    borderRadius: 999,
  },
  conditionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  warningBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 12,
    gap: 4,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.sandbox.light,
  },
  warningDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 12,
  },
});
