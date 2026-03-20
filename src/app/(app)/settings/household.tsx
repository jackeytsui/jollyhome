import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LeaveHouseholdDialog } from '@/components/household/LeaveHouseholdDialog';
import { useHousehold } from '@/hooks/useHousehold';
import { useMembers } from '@/hooks/useMembers';
import { useHouseholdStore } from '@/stores/household';
import { colors } from '@/constants/theme';

const EXPIRY_OPTIONS = [
  { label: '1 day', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: 'Never', value: null },
];

export default function HouseholdSettingsScreen() {
  const { activeHouseholdId, householdName, userRole, memberCount } = useHouseholdStore();
  const { updateHousehold, isLoading } = useHousehold();
  const { leaveHousehold } = useMembers(activeHouseholdId);

  const isAdmin = userRole === 'admin';

  const [name, setName] = useState(householdName ?? '');
  const [joinApproval, setJoinApproval] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState<number | null>(7);
  const [saving, setSaving] = useState(false);
  const [leaveDialogVisible, setLeaveDialogVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setName(householdName ?? '');
  }, [householdName]);

  async function handleSave() {
    if (!activeHouseholdId) return;
    setSaving(true);
    try {
      await updateHousehold(activeHouseholdId, {
        name: name.trim() || householdName || '',
        join_approval_required: joinApproval,
        invite_expiry_days: inviteExpiry,
      });
      Alert.alert('Saved', 'Household settings updated.');
    } catch {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLeaveConfirm() {
    setLeaving(true);
    try {
      await leaveHousehold();
      setLeaveDialogVisible(false);
      router.replace('/(app)/create-household');
    } catch (err) {
      setLeaveDialogVisible(false);
      const message = err instanceof Error ? err.message : 'Failed to leave household';
      Alert.alert('Error', message);
    } finally {
      setLeaving(false);
    }
  }

  const MAX_MEMBERS = 6;

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Household Settings</Text>

        {/* Household Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Info</Text>
          <Input
            label="Household Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter household name"
            autoCapitalize="words"
          />
        </View>

        {/* Invite Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Configuration</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Join approval required</Text>
            <Switch
              value={joinApproval}
              onValueChange={isAdmin ? setJoinApproval : undefined}
              disabled={!isAdmin}
              trackColor={{ false: colors.border.light, true: colors.accent.light }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={styles.fieldLabel}>Invite link expiry</Text>
          <View style={styles.expiryOptions}>
            {EXPIRY_OPTIONS.map((opt) => {
              const isSelected = inviteExpiry === opt.value;
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => isAdmin && setInviteExpiry(opt.value)}
                  style={[styles.expiryChip, isSelected && styles.expiryChipSelected]}
                  disabled={!isAdmin}
                >
                  <Text style={[styles.expiryChipText, isSelected && styles.expiryChipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Member Limit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          <View style={styles.memberLimitRow}>
            <Text style={styles.memberLimitText}>
              {memberCount} / {MAX_MEMBERS} members
            </Text>
            {memberCount >= MAX_MEMBERS && (
              <Text style={styles.upgradeText}>Upgrade to add more</Text>
            )}
          </View>
        </View>

        {isAdmin && (
          <Button
            label="Save Changes"
            variant="primary"
            onPress={handleSave}
            loading={saving || isLoading}
          />
        )}

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <Button
            label="Leave Household"
            variant="destructive"
            onPress={() => setLeaveDialogVisible(true)}
          />
        </View>
      </ScrollView>

      <LeaveHouseholdDialog
        visible={leaveDialogVisible}
        onConfirm={handleLeaveConfirm}
        onCancel={() => setLeaveDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  expiryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expiryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary.light,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  expiryChipSelected: {
    borderColor: colors.accent.light,
    backgroundColor: colors.accent.light + '1A',
  },
  expiryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  expiryChipTextSelected: {
    color: colors.accent.light,
  },
  memberLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberLimitText: {
    fontSize: 16,
    color: colors.textPrimary.light,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
  dangerSection: {
    backgroundColor: colors.destructive.light + '0D',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.destructive.light + '40',
    marginTop: 8,
  },
  dangerTitle: {
    color: colors.destructive.light,
  },
});
