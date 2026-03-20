import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  SectionList,
} from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button } from '@/components/ui/Button';
import { MemberListItem } from '@/components/household/MemberListItem';
import { RemoveMemberDialog } from '@/components/household/RemoveMemberDialog';
import { InviteSheet } from '@/components/household/InviteSheet';
import { useMembers, type Member } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import { colors } from '@/constants/theme';

async function getOutstandingBalance(
  _householdId: string,
  _userId: string
): Promise<{ hasBalance: boolean; amount: string }> {
  // Phase 2 will query the expenses/balances table here.
  // For now, return no outstanding balance since expense tracking
  // is not yet implemented.
  // TODO(Phase-2): Replace with actual balance query from expenses table
  return { hasBalance: false, amount: '$0.00' };
}

export default function MembersScreen() {
  const { user } = useAuthStore();
  const { activeHouseholdId, householdName, userRole } = useHouseholdStore();
  const { members, loadMembers, removeMember, updateMemberRole, isLoading } = useMembers(activeHouseholdId);
  const inviteSheetRef = useRef<BottomSheetModal>(null);

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removeBalanceData, setRemoveBalanceData] = useState<{ hasBalance: boolean; amount: string }>({
    hasBalance: false,
    amount: '$0.00',
  });

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouseholdId]);

  const isAdmin = userRole === 'admin';

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  const sections = [
    ...(activeMembers.length > 0 ? [{ title: 'Active Members', data: activeMembers }] : []),
    ...(pendingMembers.length > 0 ? [{ title: 'Pending', data: pendingMembers }] : []),
  ];

  async function handleRemovePress(member: Member) {
    if (activeHouseholdId) {
      const balance = await getOutstandingBalance(activeHouseholdId, member.user_id);
      setRemoveBalanceData(balance);
    }
    setRemoveTarget(member);
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    try {
      await removeMember(removeTarget.id);
    } catch {
      // error handled by hook
    } finally {
      setRemoveTarget(null);
    }
  }

  async function handlePromote(member: Member) {
    try {
      await updateMemberRole(member.id, 'admin');
    } catch {
      // error handled by hook
    }
  }

  async function handleDemote(member: Member) {
    try {
      await updateMemberRole(member.id, 'member');
    } catch {
      // error handled by hook
    }
  }

  const isSolo = activeMembers.length <= 1 && pendingMembers.length === 0;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          Members {members.length > 0 ? `(${members.length})` : ''}
        </Text>
      </View>

      {isSolo ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No other members yet</Text>
          <View style={styles.emptyAction}>
            <Button
              label="Share Invite Link"
              variant="primary"
              onPress={() => inviteSheetRef.current?.present()}
            />
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <MemberListItem
              member={item}
              isCurrentUser={item.user_id === user?.id}
              isAdmin={isAdmin}
              onRemove={handleRemovePress}
              onPromote={handlePromote}
              onDemote={handleDemote}
            />
          )}
          onRefresh={loadMembers}
          refreshing={isLoading}
          ListFooterComponent={
            <View style={styles.footer}>
              <Button
                label="Share Invite Link"
                variant="primary"
                onPress={() => inviteSheetRef.current?.present()}
              />
            </View>
          }
        />
      )}

      {activeHouseholdId ? (
        <InviteSheet
          ref={inviteSheetRef}
          householdId={activeHouseholdId}
          householdName={householdName ?? ''}
        />
      ) : null}

      <RemoveMemberDialog
        visible={removeTarget !== null}
        memberName={removeTarget?.profile.display_name ?? 'this member'}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveTarget(null)}
        hasOutstandingBalance={removeBalanceData.hasBalance}
        balanceAmount={removeBalanceData.amount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary.light,
    textAlign: 'center',
  },
  emptyAction: {
    width: '100%',
  },
  footer: {
    marginTop: 24,
  },
});
