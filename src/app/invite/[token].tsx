import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useInvite } from '@/hooks/useInvite';
import { useAuthStore } from '@/stores/auth';
import { captureEvent } from '@/lib/posthog';
import { colors } from '@/constants/theme';

const APP_STORE_URL = 'https://apps.apple.com/app/jolly-home'; // placeholder
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.jollyhome'; // placeholder

export default function InviteTokenScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session } = useAuthStore();
  const { getInviteInfo, redeemInvite, isLoading } = useInvite();

  const [inviteInfo, setInviteInfo] = useState<{
    id: string;
    household_id: string;
    household_name: string;
    household_avatar_url: string | null;
    member_count: number;
    expires_at: string | null;
    max_uses: number | null;
    use_count: number;
    is_valid: boolean;
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const isAuthenticated = !!session;

  useEffect(() => {
    if (!token || hasFetched) return;

    async function fetchInvite() {
      try {
        const info = await getInviteInfo(token as string);
        setInviteInfo(info);

        if (!info) {
          setFetchError('This invite link is invalid or no longer exists.');
        } else if (!info.is_valid) {
          const isExpired =
            info.expires_at != null && new Date(info.expires_at) <= new Date();
          const isUsedUp = info.max_uses != null && info.use_count >= info.max_uses;
          if (isExpired) {
            setFetchError(
              'This invite has expired. Ask your household admin to send a new one.'
            );
          } else if (isUsedUp) {
            setFetchError(
              'This invite link has already been used. Ask your household admin for a new one.'
            );
          } else {
            setFetchError('This invite is no longer valid.');
          }
        }

        captureEvent('invite_viewed', {
          token: token as string,
          is_valid: info?.is_valid ?? false,
          is_authenticated: isAuthenticated,
        });
      } catch {
        setFetchError('Unable to load invite details. Please check your connection.');
      } finally {
        setHasFetched(true);
      }
    }

    fetchInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleJoin() {
    if (!token || !inviteInfo) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      await redeemInvite(token as string);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/(home)/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to join household. Please try again.';
      setJoinError(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsJoining(false);
    }
  }

  function handleSignUp() {
    router.push({
      pathname: '/(auth)/sign-up',
      params: { returnTo: `/invite/${token}` },
    });
  }

  // Loading state
  if (!hasFetched) {
    return (
      <SafeAreaView style={[styles.flex, styles.bgDominant]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent.light} />
          <Text style={styles.loadingText}>Loading invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state (invalid/expired/used)
  if (fetchError || !inviteInfo) {
    return (
      <SafeAreaView style={[styles.flex, styles.bgDominant]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.errorCard}>
            <View style={styles.errorIconRow}>
              <AlertCircle color={colors.destructive.light} size={32} />
            </View>
            <Text style={styles.errorHeading}>Invite Unavailable</Text>
            <Text style={styles.errorBody}>
              {fetchError ?? 'This invite link is no longer valid.'}
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials = inviteInfo.household_name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.flex, styles.bgDominant]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Household preview card */}
        <Card style={styles.previewCard}>
          <View style={styles.avatarRow}>
            <Avatar
              uri={inviteInfo.household_avatar_url ?? undefined}
              initials={initials}
              size="lg"
            />
          </View>

          <Text style={styles.householdName}>{inviteInfo.household_name}</Text>
          <Text style={styles.memberCount}>
            {inviteInfo.member_count}{' '}
            {inviteInfo.member_count === 1 ? 'member' : 'members'}
          </Text>
        </Card>

        {/* Join error */}
        {joinError ? (
          <Card style={styles.joinErrorCard}>
            <Text style={styles.joinErrorText}>{joinError}</Text>
          </Card>
        ) : null}

        {/* Action buttons */}
        {isAuthenticated ? (
          <Button
            label="Join Household"
            variant="primary"
            size="lg"
            onPress={handleJoin}
            loading={isJoining}
            disabled={isJoining || isLoading}
          />
        ) : (
          <>
            <Button
              label="Join Household"
              variant="primary"
              size="lg"
              onPress={handleSignUp}
            />
            <Text style={styles.signInHint}>
              Already have an account?{' '}
              <Text
                style={styles.signInLink}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/sign-in',
                    params: { returnTo: `/invite/${token}` },
                  })
                }
              >
                Sign in
              </Text>
            </Text>

            {/* App store banner */}
            <Card style={styles.storeBanner}>
              <Text style={styles.storeBannerTitle}>Get the Jolly Home app</Text>
              <Text style={styles.storeBannerBody}>
                Download the app for the full household experience.
              </Text>
              <View style={styles.storeButtons}>
                <Button
                  label="App Store"
                  variant="secondary"
                  size="sm"
                  onPress={() => Linking.openURL(APP_STORE_URL)}
                />
                <Button
                  label="Google Play"
                  variant="secondary"
                  size="sm"
                  onPress={() => Linking.openURL(PLAY_STORE_URL)}
                />
              </View>
            </Card>
          </>
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
    justifyContent: 'center',
  },
  errorCard: {
    alignItems: 'center',
    gap: 12,
  },
  errorIconRow: {
    marginBottom: 4,
  },
  errorHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
    textAlign: 'center',
  },
  previewCard: {
    alignItems: 'center',
    gap: 8,
  },
  avatarRow: {
    marginBottom: 4,
  },
  householdName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  joinErrorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.destructive.light,
  },
  joinErrorText: {
    fontSize: 14,
    color: colors.destructive.light,
    lineHeight: 20,
  },
  signInHint: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
    textAlign: 'center',
  },
  signInLink: {
    color: colors.accent.light,
    fontWeight: '600',
  },
  storeBanner: {
    gap: 8,
    marginTop: 8,
  },
  storeBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  storeBannerBody: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});
