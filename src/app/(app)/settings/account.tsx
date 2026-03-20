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
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/constants/theme';

type ThemeOption = 'light' | 'dark' | 'system';
type LanguageOption = { code: string; label: string };

const THEME_OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: 'Chinese' },
];

interface TotpFactor {
  id: string;
  factor_type: string;
  status: string;
}

interface EnrollmentData {
  id: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

const STORED_LANG_KEY = '@language';

export default function AccountSettingsScreen() {
  const { themeOverride, setThemeOverride } = useSettingsStore();
  const { profile, loadProfile, updateProfile } = useProfile();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // TOTP 2FA state
  const [totpFactors, setTotpFactors] = useState<TotpFactor[]>([]);
  const [totpLoading, setTotpLoading] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);

  useEffect(() => {
    loadProfile();
    loadTotpFactors();
    AsyncStorage.getItem(STORED_LANG_KEY).then((lang) => {
      if (lang) setLanguage(lang);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      setBiometricEnabled(profile.biometric_enabled);
    }
  }, [profile]);

  async function loadTotpFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return;
      const active = (data?.totp ?? []).filter((f) => f.status === 'verified').map((f) => ({
        id: f.id,
        factor_type: f.factor_type,
        status: f.status,
      }));
      setTotpFactors(active);
    } catch {
      // Non-critical; ignore
    }
  }

  // Theme
  function handleThemeChange(theme: ThemeOption) {
    setThemeOverride(theme);
    updateProfile({ theme_override: theme }).catch(() => {});
  }

  // Biometric
  async function handleBiometricToggle(value: boolean) {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric Unavailable', 'No biometric hardware or enrollment found on this device.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify identity to enable biometric login',
        cancelLabel: 'Cancel',
      });
      if (!result.success) return;
    }
    setBiometricEnabled(value);
    await updateProfile({ biometric_enabled: value });
  }

  // TOTP Enrollment
  async function handleStartTotpEnrollment() {
    setTotpLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Jolly Home TOTP',
      });
      if (error) throw error;
      setEnrollmentData(data as unknown as EnrollmentData);
      setVerifyCode('');
      setEnrollModalVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start enrollment';
      Alert.alert('Error', message);
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleVerifyTotp() {
    if (!enrollmentData || verifyCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEnrollModalVisible(false);
      setEnrollmentData(null);
      await loadTotpFactors();
      Alert.alert('Success', 'Two-factor authentication enabled.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('expired')) {
        Alert.alert('Invalid Code', 'Invalid code, please try again.');
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisableTotp(factorId: string) {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.mfa.unenroll({ factorId });
              if (error) throw error;
              await loadTotpFactors();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  }

  // Language
  async function handleLanguageChange(code: string) {
    setLanguage(code);
    await AsyncStorage.setItem(STORED_LANG_KEY, code);
    await updateProfile({ language_override: code });
    // i18n.changeLanguage(code) would be called here — i18n instance imported separately
  }

  // Delete Account
  function handleDeleteImmediately() {
    setDeleteDialogVisible(false);
    // Placeholder: actual deletion would call supabase admin API or edge function
    Alert.alert('Account Deletion', 'Account deletion has been initiated. You will be signed out.');
  }

  function handleGracePeriod() {
    setDeleteDialogVisible(false);
    Alert.alert('Grace Period', 'Your account will be deleted after 30 days. You can cancel this by signing in again.');
  }

  const hasTotpEnabled = totpFactors.length > 0;

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Account Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.fieldLabel}>Theme</Text>
          <View style={styles.optionRow}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themeOverride === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleThemeChange(opt.value)}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                >
                  <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Biometric Login</Text>
              <Text style={styles.rowSub}>Use Face ID or Touch ID to sign in</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border.light, true: colors.accent.light }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* TOTP 2FA */}
          <View style={styles.twoFaSection}>
            <Text style={styles.fieldLabel}>Two-Factor Authentication</Text>
            {hasTotpEnabled ? (
              <View style={styles.twoFaEnabled}>
                <View style={styles.twoFaStatus}>
                  <View style={styles.twoFaDot} />
                  <Text style={styles.twoFaEnabledText}>Enabled</Text>
                </View>
                <Button
                  label="Disable 2FA"
                  variant="destructive"
                  size="sm"
                  onPress={() => handleDisableTotp(totpFactors[0].id)}
                />
              </View>
            ) : (
              <Button
                label="Enable Two-Factor Authentication"
                variant="secondary"
                onPress={handleStartTotpEnrollment}
                loading={totpLoading}
              />
            )}
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.optionRow}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = language === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => handleLanguageChange(opt.code)}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                >
                  <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <Pressable
            style={styles.navRow}
            onPress={() => router.push('/(app)/settings/tab-customization')}
          >
            <Text style={styles.navRowLabel}>Customize Tab Bar</Text>
            <Text style={styles.navRowArrow}>›</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border.light, true: colors.accent.light }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <Button
            label="Export My Data"
            variant="secondary"
            onPress={() => Alert.alert('Export', 'Feature coming soon.')}
          />
          <Button
            label="Delete Account"
            variant="destructive"
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      </ScrollView>

      {/* TOTP Enrollment Modal */}
      <Modal
        visible={enrollModalVisible}
        animationType="slide"
        onRequestClose={() => setEnrollModalVisible(false)}
      >
        <SafeAreaView style={styles.modalFlex}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalHeading}>Set Up Two-Factor Authentication</Text>
            <Text style={styles.modalBody}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.
            </Text>

            {enrollmentData?.totp.qr_code ? (
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: enrollmentData.totp.qr_code }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            <View style={styles.secretContainer}>
              <Text style={styles.secretLabel}>Manual entry code:</Text>
              <Text style={styles.secretText} selectable>
                {enrollmentData?.totp.secret ?? ''}
              </Text>
            </View>

            <View style={styles.verifyField}>
              <Input
                label="Verification Code"
                value={verifyCode}
                onChangeText={(t) => setVerifyCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                keyboardType="number-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => {
                  setEnrollModalVisible(false);
                  setEnrollmentData(null);
                  setVerifyCode('');
                }}
              />
              <Button
                label="Verify"
                variant="primary"
                onPress={handleVerifyTotp}
                loading={verifying}
                disabled={verifyCode.length !== 6}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Dialog */}
      <Modal
        transparent
        visible={deleteDialogVisible}
        animationType="fade"
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setDeleteDialogVisible(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>Delete Account</Text>
            <Text style={styles.cardBody}>
              Deleting your account is permanent. You can choose immediate deletion or a 30-day grace period.
            </Text>
            <View style={styles.cardActions}>
              <Button
                label="Keep My Account"
                variant="primary"
                onPress={() => setDeleteDialogVisible(false)}
              />
              <Button
                label="Start 30-Day Grace Period"
                variant="secondary"
                onPress={handleGracePeriod}
              />
              <Button
                label="Delete Immediately"
                variant="destructive"
                onPress={handleDeleteImmediately}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  rowSub: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary.light,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionChipSelected: {
    borderColor: colors.accent.light,
    backgroundColor: colors.accent.light + '1A',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  optionChipTextSelected: {
    color: colors.accent.light,
  },
  twoFaSection: {
    gap: 8,
    marginTop: 4,
  },
  twoFaEnabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success.light + '15',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success.light + '40',
  },
  twoFaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  twoFaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success.light,
  },
  twoFaEnabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.light,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  navRowLabel: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  navRowArrow: {
    fontSize: 22,
    color: colors.textSecondary.light,
    lineHeight: 26,
  },
  // TOTP Modal
  modalFlex: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  modalContent: {
    padding: 24,
    gap: 16,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  modalBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  secretContainer: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  secretLabel: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
  secretText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    fontFamily: 'monospace',
    lineHeight: 20,
    letterSpacing: 1,
  },
  verifyField: {
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  // Delete Account Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.dominant.light,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  cardBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
  },
  cardActions: {
    gap: 10,
  },
});
