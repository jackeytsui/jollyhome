import React from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

const HERO_IMAGE = require('../../assets/landing/family-in-a-kitchen.jpg');

const FEATURE_COLUMNS = [
  {
    title: 'One shared ledger',
    body: 'Receipts, balances, settlements, and expense history live in one place instead of being split across chat, notes, and a finance app.',
  },
  {
    title: 'A live household timeline',
    body: 'Meals, chores, quiet hours, guests, bookings, and maintenance all show up in one timeline with the same underlying state.',
  },
  {
    title: 'Food decisions with memory',
    body: 'Shopping, pantry stock, and meal planning feed each other so the app can recommend what fits your home, not just suggest random dishes.',
  },
];

const CONNECTED_FLOWS = [
  {
    kicker: 'Receipt to reality',
    title: 'One grocery receipt can update three systems',
    body: 'A single review flow can save the expense, update pantry inventory, and reconcile matching shopping items.',
  },
  {
    kicker: 'Calendar to action',
    title: 'Schedules affect what gets recommended',
    body: 'Who is home, what is urgent, and what is already planned informs meals, chores, and next-step suggestions.',
  },
  {
    kicker: 'Household memory',
    title: 'The assistant answers from real household state',
    body: 'It reads the same graph as the dashboard and workflow screens instead of inventing disconnected summaries.',
  },
];

const LAUNCH_PILLARS = [
  'Public web landing and app entry routing',
  'Expo and EAS preview and production scripts',
  'Release runbook, store listing draft, and launch checklist',
  'Static web export path validated locally',
];

const serifFamily = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : undefined;
const sansFamily = Platform.OS === 'web' ? '"Trebuchet MS", "Segoe UI", sans-serif' : undefined;

function CTAButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'ghost' && styles.ghostButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryButtonText,
          variant !== 'primary' && styles.secondaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const isMedium = width >= 760;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.canvas}>
          <View style={styles.backGlowOne} />
          <View style={styles.backGlowTwo} />

          <View style={styles.navRow}>
            <View style={styles.wordmarkWrap}>
              <Text style={styles.wordmarkOverline}>Household operating system</Text>
              <Text style={[styles.wordmark, { fontFamily: serifFamily }]}>Jolly Home</Text>
            </View>
            <Pressable onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')}>
              <Text style={styles.navLink}>GitHub</Text>
            </Pressable>
          </View>

          <View style={[styles.heroShell, isWide ? styles.heroShellWide : styles.heroShellStack]}>
            <View style={[styles.heroCopy, isWide ? styles.heroCopyWide : null]}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Launch-ready shared living platform</Text>
              </View>

              <Text style={[styles.heroTitle, { fontFamily: serifFamily }]}>
                Shared living deserves more than a pile of disconnected utilities.
              </Text>

              <Text style={[styles.heroSubtitle, { fontFamily: sansFamily }]}>
                Jolly Home brings money, chores, meals, stock, calendar coordination, maintenance, and household AI into one
                connected operating system.
              </Text>

              <Text style={styles.heroBody}>
                The point is not just having every feature. The point is having them affect each other so the home feels coordinated:
                receipts can close shopping loops, pantry state can shape meal suggestions, and the assistant can answer from real
                household context.
              </Text>

              <View style={styles.ctaRow}>
                <CTAButton label="Create account" variant="primary" onPress={() => router.push('/(auth)/sign-up')} />
                <CTAButton label="Sign in" variant="secondary" onPress={() => router.push('/(auth)/sign-in')} />
                <CTAButton
                  label="View code"
                  variant="ghost"
                  onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')}
                />
              </View>

              <View style={[styles.metricRow, !isMedium && styles.metricRowStack]}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>7</Text>
                  <Text style={styles.metricLabel}>product phases shipped</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>42</Text>
                  <Text style={styles.metricLabel}>plans executed and summarized</Text>
                </View>
                <View style={styles.metricCardAccent}>
                  <Text style={styles.metricAccentTitle}>Public web + app path</Text>
                  <Text style={styles.metricAccentBody}>Web export, launch gate, and release runbook are already in repo.</Text>
                </View>
              </View>
            </View>

            <View style={[styles.heroVisual, isWide ? styles.heroVisualWide : null]}>
              <View style={styles.imageFrame}>
                <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
                <View style={styles.imageCaption}>
                  <Text style={styles.imageCaptionEyebrow}>Public-domain photo</Text>
                  <Text style={styles.imageCaptionText}>A real home scene instead of generic startup abstraction.</Text>
                </View>
              </View>

              <View style={[styles.floatingCard, styles.floatingCardUpper]}>
                <Text style={styles.floatingCardKicker}>Connected flow</Text>
                <Text style={styles.floatingCardTitle}>Receipt → pantry → shopping</Text>
              </View>

              <View style={[styles.floatingCardWarm, styles.floatingCardLower]}>
                <Text style={styles.floatingCardKickerDark}>Why it matters</Text>
                <Text style={styles.floatingCardTitleDark}>People feel the value when the home updates itself once, not three times.</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionShell}>
            <Text style={[styles.sectionKicker, { fontFamily: sansFamily }]}>What makes the product feel higher-level</Text>
            <Text style={[styles.sectionTitle, { fontFamily: serifFamily }]}>This is designed like a household system, not a feature stack.</Text>

            <View style={[styles.featureGrid, isWide ? styles.featureGridWide : styles.featureGridStack]}>
              {FEATURE_COLUMNS.map((item) => (
                <View key={item.title} style={styles.featureCard}>
                  <Text style={styles.featureCardTitle}>{item.title}</Text>
                  <Text style={styles.featureCardBody}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.sectionShell, styles.darkPanel]}>
            <View style={styles.darkPanelHeader}>
              <Text style={[styles.sectionKickerDark, { fontFamily: sansFamily }]}>Connected workflows</Text>
              <Text style={[styles.sectionTitleDark, { fontFamily: serifFamily }]}>The product is strongest where features overlap.</Text>
            </View>

            <View style={styles.flowList}>
              {CONNECTED_FLOWS.map((item, index) => (
                <View key={item.title} style={styles.flowRow}>
                  <View style={styles.flowIndex}>
                    <Text style={styles.flowIndexText}>0{index + 1}</Text>
                  </View>
                  <View style={styles.flowContent}>
                    <Text style={styles.flowKicker}>{item.kicker}</Text>
                    <Text style={styles.flowTitle}>{item.title}</Text>
                    <Text style={styles.flowBody}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.sectionShell, styles.launchStrip]}>
            <View style={styles.launchCopy}>
              <Text style={[styles.sectionKicker, { fontFamily: sansFamily }]}>Ready to ship forward</Text>
              <Text style={[styles.sectionTitle, { fontFamily: serifFamily }]}>The repo now has an actual launch layer, not just feature code.</Text>
            </View>
            <View style={styles.launchList}>
              {LAUNCH_PILLARS.map((item) => (
                <View key={item} style={styles.launchItem}>
                  <View style={styles.launchDot} />
                  <Text style={styles.launchItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Hero image: “Family in a kitchen” by Bill Branson / National Cancer Institute via Wikimedia Commons. Public domain.
            </Text>
            <Pressable onPress={() => Linking.openURL('https://commons.wikimedia.org/wiki/File:Family_in_a_kitchen.jpg')}>
              <Text style={styles.footerLink}>View image source and rights</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6EFE7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  canvas: {
    flex: 1,
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 42,
    gap: 22,
  },
  backGlowOne: {
    position: 'absolute',
    top: 80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#F6C49D',
    opacity: 0.36,
  },
  backGlowTwo: {
    position: 'absolute',
    left: -40,
    top: 310,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: '#D8E1C7',
    opacity: 0.58,
  },
  navRow: {
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  wordmarkWrap: {
    gap: 3,
  },
  wordmarkOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#726252',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  wordmark: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
    color: '#241A14',
  },
  navLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A4A18',
  },
  heroShell: {
    zIndex: 1,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#E7D2BF',
    backgroundColor: '#FBF7F2',
    overflow: 'hidden',
    padding: 22,
    gap: 22,
  },
  heroShellWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroShellStack: {
    flexDirection: 'column',
  },
  heroCopy: {
    gap: 16,
  },
  heroCopyWide: {
    flex: 1.02,
    paddingRight: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEE4D5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6C5C4D',
  },
  heroTitle: {
    fontSize: 54,
    lineHeight: 58,
    color: '#221813',
    fontWeight: '700',
    maxWidth: 680,
  },
  heroSubtitle: {
    fontSize: 21,
    lineHeight: 31,
    color: '#382A22',
    maxWidth: 690,
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#68594C',
    maxWidth: 640,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  primaryButton: {
    backgroundColor: '#9C4A1B',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D9C2AF',
    backgroundColor: '#FFF8F1',
  },
  ghostButton: {
    backgroundColor: '#EDE1D1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#261B15',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  metricRowStack: {
    flexDirection: 'column',
  },
  metricCard: {
    minWidth: 132,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#F4EADB',
    gap: 5,
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '800',
    color: '#201712',
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B5A4C',
  },
  metricCardAccent: {
    flex: 1,
    minWidth: 220,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#DDE7D0',
    gap: 6,
  },
  metricAccentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#254031',
  },
  metricAccentBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#345142',
  },
  heroVisual: {
    minHeight: 560,
    justifyContent: 'center',
  },
  heroVisualWide: {
    flex: 0.98,
  },
  imageFrame: {
    flex: 1,
    minHeight: 520,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#DCC6B3',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageCaption: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(23, 16, 12, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  imageCaptionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#EFD9C3',
  },
  imageCaptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFF5EA',
  },
  floatingCard: {
    position: 'absolute',
    right: 14,
    maxWidth: 220,
    borderRadius: 20,
    backgroundColor: '#F8F0E5',
    borderWidth: 1,
    borderColor: '#E7D2BE',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  floatingCardWarm: {
    position: 'absolute',
    left: 14,
    maxWidth: 230,
    borderRadius: 20,
    backgroundColor: '#9D4E22',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  floatingCardUpper: {
    top: 18,
  },
  floatingCardLower: {
    bottom: 26,
  },
  floatingCardKicker: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#886A55',
  },
  floatingCardTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: '#261A15',
  },
  floatingCardKickerDark: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#F8D3BE',
  },
  floatingCardTitleDark: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: '#FFF5ED',
  },
  sectionShell: {
    zIndex: 1,
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 24,
    backgroundColor: '#FBF7F2',
    borderWidth: 1,
    borderColor: '#E8D8C6',
    gap: 18,
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5D42',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    fontSize: 36,
    lineHeight: 40,
    color: '#221913',
    fontWeight: '700',
    maxWidth: 820,
  },
  featureGrid: {
    gap: 14,
  },
  featureGridWide: {
    flexDirection: 'row',
  },
  featureGridStack: {
    flexDirection: 'column',
  },
  featureCard: {
    flex: 1,
    minWidth: 240,
    borderRadius: 22,
    backgroundColor: '#F3E8DB',
    padding: 18,
    gap: 10,
  },
  featureCardTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: '#211711',
  },
  featureCardBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#665447',
  },
  darkPanel: {
    backgroundColor: '#261C16',
    borderColor: '#3B2A20',
  },
  darkPanelHeader: {
    gap: 10,
  },
  sectionKickerDark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F6BE95',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  sectionTitleDark: {
    fontSize: 34,
    lineHeight: 39,
    color: '#FFF5EB',
    fontWeight: '700',
    maxWidth: 760,
  },
  flowList: {
    gap: 14,
  },
  flowRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#453229',
    paddingTop: 14,
  },
  flowIndex: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#A04E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowIndexText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF6EF',
  },
  flowContent: {
    flex: 1,
    gap: 4,
  },
  flowKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E6B38C',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  flowTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#FFF5EC',
  },
  flowBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#D6C1B3',
  },
  launchStrip: {
    backgroundColor: '#E6EBD8',
    borderColor: '#D1D9BC',
  },
  launchCopy: {
    gap: 10,
  },
  launchList: {
    gap: 10,
  },
  launchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  launchDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#8E4D21',
  },
  launchItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#334433',
  },
  footer: {
    zIndex: 1,
    paddingHorizontal: 6,
    paddingTop: 4,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#766555',
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A4A18',
  },
});
