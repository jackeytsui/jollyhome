import React, { forwardRef, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Share,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useInvite } from '@/hooks/useInvite';
import { colors } from '@/constants/theme';

interface InviteSheetProps {
  householdId: string;
  householdName: string;
}

export const InviteSheet = forwardRef<BottomSheetModal, InviteSheetProps>(
  function InviteSheet({ householdId, householdName }, ref) {
    const { t } = useTranslation();
    const { createInvite, getInviteUrl, isLoading } = useInvite();

    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [inviteExpiryDays, setInviteExpiryDays] = useState<number>(7);
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState('');
    const hasCreatedInvite = useRef(false);

    const handleSheetChange = useCallback(
      async (index: number) => {
        if (index >= 0 && !hasCreatedInvite.current) {
          hasCreatedInvite.current = true;
          try {
            const invite = await createInvite(householdId);
            const url = getInviteUrl(invite.token);
            setInviteUrl(url);
            if (invite.expires_at) {
              const diff =
                (new Date(invite.expires_at).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24);
              setInviteExpiryDays(Math.ceil(diff));
            }
          } catch {
            // silently fail — UI shows loading state
          }
        }
        // Reset when closed
        if (index === -1) {
          hasCreatedInvite.current = false;
          setInviteUrl(null);
          setCopied(false);
          setEmail('');
        }
      },
      [createInvite, getInviteUrl, householdId]
    );

    async function handleCopyLink() {
      if (!inviteUrl) return;
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    async function handleShare() {
      if (!inviteUrl) return;
      await Share.share({
        url: inviteUrl,
        message: `Join ${householdName} on Jolly Home: ${inviteUrl}`,
      });
    }

    async function handleEmailSend() {
      if (!inviteUrl || !email.trim()) return;
      const subject = encodeURIComponent(`Join ${householdName} on Jolly Home`);
      const body = encodeURIComponent(
        `Hey! I'd like you to join my household on Jolly Home.\n\nTap this link to join: ${inviteUrl}`
      );
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      // Use Linking to open mail app
      const { default: Linking } = await import('expo-linking');
      Linking.openURL(mailtoUrl);
    }

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const truncateUrl = (url: string) => {
      if (url.length <= 40) return url;
      return url.slice(0, 37) + '...';
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['50%', '90%']}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.title}>Invite to {householdName}</Text>

          {isLoading || !inviteUrl ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.light} />
              <Text style={styles.loadingText}>Generating invite...</Text>
            </View>
          ) : (
            <>
              {/* QR Code section */}
              <View style={styles.qrSection}>
                <QRCode value={inviteUrl} size={200} />
                <Text style={styles.qrLabel}>Scan to join</Text>
              </View>

              {/* Copy Link section */}
              <View style={styles.copySection}>
                <Text style={styles.urlText} numberOfLines={1}>
                  {truncateUrl(inviteUrl)}
                </Text>
                <Button
                  label={copied ? 'Copied!' : 'Copy'}
                  variant="secondary"
                  size="sm"
                  onPress={handleCopyLink}
                />
              </View>

              {/* Share section */}
              <Button
                label={t('cta.shareInviteLink')}
                variant="primary"
                onPress={handleShare}
              />

              {/* Email invite section */}
              <View style={styles.emailSection}>
                <View style={styles.emailInputWrapper}>
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <Button
                  label="Send"
                  variant="secondary"
                  onPress={handleEmailSend}
                  disabled={!email.trim()}
                />
              </View>

              {/* Footer */}
              <Text style={styles.expiryNote}>
                Invite expires in {inviteExpiryDays} {inviteExpiryDays === 1 ? 'day' : 'days'}
              </Text>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.secondary.light,
  },
  handleIndicator: {
    backgroundColor: colors.border.light,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    textAlign: 'center',
  },
  loadingContainer: {
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
  qrSection: {
    alignItems: 'center',
    gap: 8,
  },
  qrLabel: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  copySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dominant.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  emailSection: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  emailInputWrapper: {
    flex: 1,
  },
  expiryNote: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
    textAlign: 'center',
  },
});
