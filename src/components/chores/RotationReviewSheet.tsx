import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface MemberOption {
  id: string;
  label: string;
}

export interface RotationReviewItem {
  choreInstanceId: string;
  templateId: string;
  title: string;
  recommendedMemberId: string | null;
  estimatedEffortMinutes: number;
  rationale: string[];
}

interface RotationReviewSheetProps {
  visible: boolean;
  items: RotationReviewItem[];
  memberOptions: MemberOption[];
  loading?: boolean;
  refreshing?: boolean;
  onClose: () => void;
  onChangeAssignee: (choreInstanceId: string, memberId: string) => void;
  onRefresh: () => void;
  onConfirm: () => void;
}

function getLabel(memberOptions: MemberOption[], memberId: string | null) {
  if (!memberId) {
    return 'Unassigned';
  }

  return memberOptions.find((member) => member.id === memberId)?.label ?? 'Unassigned';
}

export function RotationReviewSheet({
  visible,
  items,
  memberOptions,
  loading = false,
  refreshing = false,
  onClose,
  onChangeAssignee,
  onRefresh,
  onConfirm,
}: RotationReviewSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Why this assignment</Text>
              <Text style={styles.title}>Review AI rotation</Text>
              <Text style={styles.subtitle}>
                Suggestions start from current availability, load, duration, and active roster. Manual override stays available before save.
              </Text>
            </View>
            <Button label="Close" size="sm" variant="ghost" onPress={onClose} />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {items.map((item) => (
              <Card key={item.choreInstanceId} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>
                      {getLabel(memberOptions, item.recommendedMemberId)} • {item.estimatedEffortMinutes} min
                    </Text>
                  </View>
                </View>

                <View style={styles.rationaleList}>
                  {item.rationale.map((reason) => (
                    <Text key={`${item.choreInstanceId}-${reason}`} style={styles.rationale}>
                      • {reason}
                    </Text>
                  ))}
                </View>

                <View style={styles.overrideWrap}>
                  <Text style={styles.overrideLabel}>Manual override</Text>
                  <View style={styles.optionRow}>
                    {memberOptions.map((member) => {
                      const selected = item.recommendedMemberId === member.id;
                      return (
                        <Pressable
                          key={`${item.choreInstanceId}-${member.id}`}
                          onPress={() => onChangeAssignee(item.choreInstanceId, member.id)}
                          style={[
                            styles.optionChip,
                            selected ? styles.optionChipSelected : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              selected ? styles.optionChipTextSelected : null,
                            ]}
                          >
                            {member.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={refreshing ? 'Refreshing suggestions...' : 'Refresh suggestions'}
              variant="secondary"
              onPress={onRefresh}
              loading={refreshing}
            />
            <Button
              label="Confirm assignments"
              onPress={onConfirm}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.dominant.light,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.accent.light,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  content: {
    gap: 12,
    paddingBottom: 4,
  },
  itemCard: {
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  itemMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  rationaleList: {
    gap: 6,
  },
  rationale: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary.light,
  },
  overrideWrap: {
    gap: 8,
  },
  overrideLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textSecondary.light,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipSelected: {
    borderColor: colors.accent.light,
    backgroundColor: '#FDE7D3',
  },
  optionChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  optionChipTextSelected: {
    color: colors.accent.light,
  },
  footer: {
    gap: 10,
  },
});
