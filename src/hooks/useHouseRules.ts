import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type {
  CoordinationEventInput,
  HouseRuleVersion,
  HouseRuleVersionInput,
  PendingRuleAcknowledgement,
  RuleAcknowledgement,
} from '@/types/rules';

const REALTIME_CHANNEL_NAME = (householdId: string) => `household:${householdId}:maintenance-house-rules`;

interface HouseRuleVersionRow {
  id: string;
  household_id: string;
  created_by: string;
  version_label: string;
  title: string;
  body: string;
  change_summary: string | null;
  is_current: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface RuleAcknowledgementRow {
  id: string;
  household_id: string;
  rule_version_id: string;
  member_id: string;
  acknowledged_at: string | null;
  created_at: string;
}

function mapRuleVersion(row: HouseRuleVersionRow): HouseRuleVersion {
  return {
    id: row.id,
    householdId: row.household_id,
    createdBy: row.created_by,
    versionLabel: row.version_label,
    title: row.title,
    body: row.body,
    changeSummary: row.change_summary,
    isCurrent: row.is_current,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAcknowledgement(row: RuleAcknowledgementRow): RuleAcknowledgement {
  return {
    id: row.id,
    householdId: row.household_id,
    ruleVersionId: row.rule_version_id,
    memberId: row.member_id,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  };
}

export function getNextRuleVersionLabel(versions: HouseRuleVersion[]): string {
  const maxVersion = versions.reduce((max, version) => {
    const parsed = Number(version.versionLabel.replace(/^v/i, ''));
    if (!Number.isFinite(parsed)) {
      return max;
    }
    return Math.max(max, parsed);
  }, 0);

  return `v${maxVersion + 1}`;
}

export function buildCoordinationEventPayload(input: CoordinationEventInput) {
  return {
    activity_type: input.activityType,
    title: input.title,
    description: input.description ?? null,
    location: input.location ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    timezone: 'UTC',
    all_day: false,
    recurrence_rule: null,
    recurrence_timezone: 'UTC',
    recurrence_anchor: input.startsAt,
    icon_key:
      input.activityType === 'quiet_hours'
        ? 'moon'
        : input.activityType === 'guest'
        ? 'users'
        : 'key',
    visual_weight: 'secondary' as const,
    owner_member_user_ids: input.ownerMemberUserIds ?? [],
    metadata: input.metadata ?? null,
  };
}

export function summarizeRuleAcknowledgements(
  currentVersion: HouseRuleVersion | null,
  acknowledgements: RuleAcknowledgement[],
  members: Array<{ user_id: string; profile: { display_name: string | null } }>
) {
  if (!currentVersion) {
    return {
      acknowledgedCount: 0,
      pending: members.map<PendingRuleAcknowledgement>((member) => ({
        memberId: member.user_id,
        memberName: member.profile.display_name ?? 'Housemate',
      })),
    };
  }

  const currentAcknowledgements = acknowledgements.filter(
    (acknowledgement) => acknowledgement.ruleVersionId === currentVersion.id && acknowledgement.acknowledgedAt
  );
  const acknowledgedMemberIds = new Set(currentAcknowledgements.map((acknowledgement) => acknowledgement.memberId));

  return {
    acknowledgedCount: currentAcknowledgements.length,
    pending: members
      .filter((member) => !acknowledgedMemberIds.has(member.user_id))
      .map<PendingRuleAcknowledgement>((member) => ({
        memberId: member.user_id,
        memberName: member.profile.display_name ?? 'Housemate',
      })),
  };
}

export function useHouseRules() {
  const [versions, setVersions] = useState<HouseRuleVersion[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<RuleAcknowledgement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadRules = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setVersions([]);
      setAcknowledgements([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [versionsResult, acknowledgementsResult] = await Promise.all([
        supabase
          .from('house_rule_versions')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('published_at', { ascending: false }),
        supabase
          .from('house_rule_acknowledgements')
          .select('*')
          .eq('household_id', activeHouseholdId),
      ]);

      if (versionsResult.error) throw versionsResult.error;
      if (acknowledgementsResult.error) throw acknowledgementsResult.error;

      setVersions(((versionsResult.data ?? []) as HouseRuleVersionRow[]).map(mapRuleVersion));
      setAcknowledgements(((acknowledgementsResult.data ?? []) as RuleAcknowledgementRow[]).map(mapAcknowledgement));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load house rules');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    const channel = supabase
      .channel(REALTIME_CHANNEL_NAME(activeHouseholdId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'house_rule_versions', filter: `household_id=eq.${activeHouseholdId}` }, loadRules)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'house_rule_acknowledgements', filter: `household_id=eq.${activeHouseholdId}` }, loadRules)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `household_id=eq.${activeHouseholdId}` }, loadRules)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadRules]);

  const currentVersion = useMemo(
    () => versions.find((version) => version.isCurrent) ?? versions[0] ?? null,
    [versions]
  );

  const publishRuleVersion = useCallback(async (input: HouseRuleVersionInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const nextLabel = getNextRuleVersionLabel(versions);

    if (versions.some((version) => version.isCurrent)) {
      const { error: demoteError } = await supabase
        .from('house_rule_versions')
        .update({ is_current: false })
        .eq('household_id', activeHouseholdId)
        .eq('is_current', true);

      if (demoteError) {
        throw demoteError;
      }
    }

    const { error: insertError } = await supabase
      .from('house_rule_versions')
      .insert({
        household_id: activeHouseholdId,
        created_by: user.id,
        version_label: nextLabel,
        title: input.title.trim(),
        body: input.body,
        change_summary: input.changeSummary ?? null,
        is_current: true,
      });

    if (insertError) {
      throw insertError;
    }

    await loadRules();
  }, [activeHouseholdId, loadRules, user, versions]);

  const acknowledgeCurrentVersion = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId || !user || !currentVersion) {
      throw new Error('No active household, user, or current rules version');
    }

    const existing = acknowledgements.find(
      (acknowledgement) =>
        acknowledgement.ruleVersionId === currentVersion.id && acknowledgement.memberId === user.id
    );

    if (existing) {
      const { error: updateError } = await supabase
        .from('house_rule_acknowledgements')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('house_rule_acknowledgements')
        .insert({
          household_id: activeHouseholdId,
          rule_version_id: currentVersion.id,
          member_id: user.id,
          acknowledged_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
    }

    await loadRules();
  }, [acknowledgements, activeHouseholdId, currentVersion, loadRules, user]);

  const createCoordinationEvent = useCallback(async (input: CoordinationEventInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const payload = buildCoordinationEventPayload(input);
    const { error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        household_id: activeHouseholdId,
        created_by: user.id,
        ...payload,
      });

    if (insertError) {
      throw insertError;
    }
  }, [activeHouseholdId, user]);

  return {
    versions,
    acknowledgements,
    currentVersion,
    loading,
    error,
    loadRules,
    publishRuleVersion,
    acknowledgeCurrentVersion,
    createCoordinationEvent,
  };
}
