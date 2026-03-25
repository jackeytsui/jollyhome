import React, { useMemo, useState } from 'react';
import {
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';

const FEATURE_CARDS = [
  {
    title: 'Money',
    blurb: 'Track expenses, split bills, scan receipts, and keep balances clear.',
    details:
      'Add expenses quickly, review receipt scans before saving, settle up with confidence, and keep a clean household ledger without spreadsheet cleanup.',
  },
  {
    title: 'Home rhythm',
    blurb: 'Run chores, calendars, quiet hours, guests, and maintenance from one place.',
    details:
      'Everyone can see what matters this week: what is due, what is planned, what is urgent, and what needs attention around the home.',
  },
  {
    title: 'Meals and supplies',
    blurb: 'Plan dinners, manage shopping lists, and stay ahead of pantry gaps.',
    details:
      'Shopping, stock, and meal planning stay connected so your home can plan with what you already have instead of starting from scratch every time.',
  },
  {
    title: 'Jolly AI',
    blurb: 'A friendly assistant that helps the household decide what to do next.',
    details:
      'Jolly can help the home stay organized, surface suggestions, and make the app feel like a calm helper instead of another system asking for work.',
  },
];

const ACCORDION_ITEMS = [
  {
    title: 'What can I do in Jolly Home?',
    summary: 'See the main capabilities in one short view.',
    content:
      'You can manage bills, chores, a shared calendar, meals, shopping, home supplies, maintenance, house rules, and member coordination in one app.',
  },
  {
    title: 'How does Jolly fit in?',
    summary: 'Jolly is the friendly AI guide for the household.',
    content:
      'Jolly helps people understand what matters right now, suggests next steps, and makes planning feel lighter. It should feel like a smart housemate, not a robotic dashboard.',
  },
  {
    title: 'Who is this for?',
    summary: 'Built for roommates, couples, and families.',
    content:
      'If multiple people share space, money, food, schedules, or responsibilities, Jolly Home is meant to reduce the friction that usually gets pushed into messages and mental overhead.',
  },
  {
    title: 'Why is this clearer than using separate apps?',
    summary: 'Because shared living problems overlap.',
    content:
      'A meal plan affects shopping. A receipt affects money. A maintenance issue affects the calendar. Jolly Home keeps those pieces close enough that the home feels coordinated.',
  },
];

const PREVIEW_STEPS = [
  'See the home at a glance',
  'Open a feature without losing context',
  'Ask Jolly what matters next',
];

const displayFamily = Platform.OS === 'web' ? '"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif' : undefined;
const sansFamily = Platform.OS === 'web' ? '"Avenir Next", "Segoe UI", sans-serif' : undefined;

function InlineIcon({
  kind,
  size = 22,
}: {
  kind: 'money' | 'home' | 'meal' | 'jolly' | 'spark';
  size?: number;
}) {
  if (kind === 'money') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="5" width="18" height="14" rx="4" stroke="#A34E20" strokeWidth="2" />
        <Circle cx="12" cy="12" r="3" stroke="#234C53" strokeWidth="2" />
      </Svg>
    );
  }

  if (kind === 'home') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M4 11L12 4L20 11" stroke="#A34E20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M6.5 10.5V19H17.5V10.5" stroke="#234C53" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (kind === 'meal') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M6 4V11" stroke="#234C53" strokeWidth="2" strokeLinecap="round" />
        <Path d="M9 4V11" stroke="#234C53" strokeWidth="2" strokeLinecap="round" />
        <Path d="M6 8H9" stroke="#234C53" strokeWidth="2" strokeLinecap="round" />
        <Path d="M15 4V19" stroke="#A34E20" strokeWidth="2" strokeLinecap="round" />
        <Path d="M15 4C17.5 4 19 5.6 19 8V10H15" stroke="#A34E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (kind === 'jolly') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="8" stroke="#234C53" strokeWidth="2" />
        <Circle cx="9.5" cy="10.5" r="1" fill="#234C53" />
        <Circle cx="14.5" cy="10.5" r="1" fill="#234C53" />
        <Path d="M9 14.5C9.8 15.5 10.9 16 12 16C13.1 16 14.2 15.5 15 14.5" stroke="#A34E20" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z" stroke="#A34E20" strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function BrandMark({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x="6" y="6" width="52" height="52" rx="18" fill="#FFF8F1" />
      <Path d="M14 29.5L32 15L50 29.5" stroke="#A34E20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 28.5V48.5C18 50.7 19.8 52.5 22 52.5H42C44.2 52.5 46 50.7 46 48.5V28.5" stroke="#A34E20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M37 25V39.5C37 44.7 33.2 48 28.6 48C24.8 48 22 45.8 22 42.2" stroke="#234C53" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="42.5" cy="22.5" r="3.25" fill="#234C53" />
    </Svg>
  );
}

function JollyFigure({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.jollyPanel, compact && styles.jollyPanelCompact]}>
      <Svg width={compact ? 220 : 280} height={compact ? 220 : 280} viewBox="0 0 280 280" fill="none">
        <Circle cx="140" cy="110" r="54" fill="#FFF9F2" />
        <Circle cx="140" cy="110" r="54" stroke="#234C53" strokeWidth="5" />
        <Rect x="95" y="171" width="90" height="58" rx="24" fill="#234C53" />
        <Circle cx="122" cy="104" r="7.5" fill="#234C53" />
        <Circle cx="158" cy="104" r="7.5" fill="#234C53" />
        <Path d="M123 132C128 139 134 142 140 142C146 142 152 139 157 132" stroke="#A34E20" strokeWidth="6" strokeLinecap="round" />
        <Path d="M140 48V61" stroke="#234C53" strokeWidth="5" strokeLinecap="round" />
        <Circle cx="140" cy="37" r="10" fill="#A34E20" />
        <Path d="M111 175C120 168 129 165 140 165C151 165 160 168 169 175" stroke="#FFF9F2" strokeWidth="6" strokeLinecap="round" />
      </Svg>
      <View style={styles.jollySpeech}>
        <Text style={styles.jollySpeechEyebrow}>Meet Jolly</Text>
        <Text style={styles.jollySpeechTitle}>A simple helper, not a complicated mascot.</Text>
        <Text style={styles.jollySpeechBody}>
          Jolly is the friendly assistant for the home. The design stays small, clear, and approachable so it supports the product instead of distracting from it.
        </Text>
      </View>
    </View>
  );
}

function FeatureAccordion({
  title,
  summary,
  content,
  open,
  onPress,
}: {
  title: string;
  summary: string;
  content: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.accordionCard, open && styles.accordionCardOpen, pressed && styles.cardPressed]}>
      <View style={styles.accordionHeader}>
        <View style={styles.accordionCopy}>
          <Text style={styles.accordionTitle}>{title}</Text>
          <Text style={styles.accordionSummary}>{summary}</Text>
        </View>
        <View style={[styles.accordionToggle, open && styles.accordionToggleOpen]}>
          <Text style={[styles.accordionToggleText, open && styles.accordionToggleTextOpen]}>{open ? '−' : '+'}</Text>
        </View>
      </View>
      {open && <Text style={styles.accordionContent}>{content}</Text>}
    </Pressable>
  );
}

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
        pressed && styles.cardPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1120;
  const isMedium = width >= 760;
  const [openCard, setOpenCard] = useState<string>(ACCORDION_ITEMS[0].title);
  const featureRows = useMemo(() => FEATURE_CARDS, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <View style={styles.brand}>
              <BrandMark size={52} />
              <View style={styles.brandCopy}>
                <Text style={[styles.brandName, { fontFamily: displayFamily }]}>Jolly Home</Text>
              </View>
            </View>

            <View style={styles.navLinks}>
              <Pressable onPress={() => router.push('/terms')}>
                <Text style={styles.navLink}>Terms</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')}>
                <Text style={styles.navLink}>GitHub</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.navLinkStrong}>Sign in</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.navBar}>
            <View style={styles.navPill}>
              <InlineIcon kind="home" size={16} />
              <Text style={styles.navPillText}>Shared home</Text>
            </View>
            <View style={styles.navPill}>
              <InlineIcon kind="money" size={16} />
              <Text style={styles.navPillText}>Expenses</Text>
            </View>
            <View style={styles.navPill}>
              <InlineIcon kind="meal" size={16} />
              <Text style={styles.navPillText}>Meals</Text>
            </View>
            <View style={styles.navPill}>
              <InlineIcon kind="jolly" size={16} />
              <Text style={styles.navPillText}>Jolly AI</Text>
            </View>
          </View>

          <View style={styles.headerBand}>
            <View style={styles.headerBandCopy}>
              <Text style={styles.headerBandTitle}>Private beta</Text>
              <Text style={styles.headerBandBody}>
                Built for invited testers who want one calm place to manage money, meals, routines, and shared-home coordination.
              </Text>
            </View>
          </View>

          <View style={[styles.hero, isWide ? styles.heroWide : styles.heroStack]}>
            <View style={[styles.heroLeft, isWide && styles.heroLeftWide]}>
              <View style={styles.badge}>
                <InlineIcon kind="spark" size={16} />
                <Text style={styles.badgeText}>A calmer way to run a shared home</Text>
              </View>

              <Text style={[styles.title, { fontFamily: displayFamily }]}>
                One place for the real life of a home.
              </Text>

              <Text style={[styles.subtitle, { fontFamily: sansFamily }]}>
                Bills, chores, meals, shopping, supplies, schedules, maintenance, and a friendly AI named Jolly.
              </Text>

              <Text style={styles.supporting}>
                Clean enough to understand in seconds. Smart enough to help the household stay on top of what matters next.
              </Text>

              <View style={styles.ctaRow}>
                <CTAButton label="Create account" variant="primary" onPress={() => router.push('/(auth)/sign-up')} />
                <CTAButton label="Sign in" variant="secondary" onPress={() => router.push('/(auth)/sign-in')} />
                <CTAButton label="View code" variant="ghost" onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')} />
              </View>

              <View style={[styles.previewRail, !isMedium && styles.previewRailStack]}>
                {PREVIEW_STEPS.map((item, index) => (
                  <View key={item} style={styles.previewStep}>
                    <View style={styles.previewIconWrap}>
                      <InlineIcon kind={index === 0 ? 'home' : index === 1 ? 'money' : 'jolly'} size={18} />
                    </View>
                    <Text style={styles.previewStepNumber}>0{index + 1}</Text>
                    <Text style={styles.previewStepText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.heroRight, isWide && styles.heroRightWide]}>
              <JollyFigure compact={!isWide} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionEyebrow, { fontFamily: sansFamily }]}>What you should expect</Text>
            <Text style={[styles.sectionHeading, { fontFamily: displayFamily }]}>The feature story is simple.</Text>
            <View style={[styles.featureGrid, isWide ? styles.featureGridWide : styles.featureGridStack]}>
              {featureRows.map((item, index) => (
                <View key={item.title} style={styles.featureCard}>
                  <View style={styles.featureIllustration}>
                    <View style={styles.featureIllustrationOrb}>
                      <InlineIcon kind={index === 0 ? 'money' : index === 1 ? 'home' : index === 2 ? 'meal' : 'jolly'} size={28} />
                    </View>
                  </View>
                  <View style={styles.featureTitleRow}>
                    <View style={styles.featureIconWrap}>
                      <InlineIcon kind={index === 0 ? 'money' : index === 1 ? 'home' : index === 2 ? 'meal' : 'jolly'} />
                    </View>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.featureBlurb}>{item.blurb}</Text>
                  <Text style={styles.featureDetail}>{item.details}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.section, styles.sectionTint]}>
            <Text style={[styles.sectionEyebrow, { fontFamily: sansFamily }]}>Tap to explore</Text>
            <Text style={[styles.sectionHeading, { fontFamily: displayFamily }]}>A clearer way to explain the product.</Text>
            <View style={styles.accordionList}>
              {ACCORDION_ITEMS.map((item) => (
                <FeatureAccordion
                  key={item.title}
                  title={item.title}
                  summary={item.summary}
                  content={item.content}
                  open={openCard === item.title}
                  onPress={() => setOpenCard((current) => (current === item.title ? '' : item.title))}
                />
              ))}
            </View>
          </View>

          <View style={[styles.section, styles.footerBand]}>
            <Text style={[styles.sectionEyebrow, { fontFamily: sansFamily }]}>Designed for real households</Text>
            <Text style={[styles.footerHeading, { fontFamily: displayFamily }]}>Professional enough to trust, warm enough to actually use.</Text>
            <Text style={styles.footerBody}>
              Jolly Home is meant to feel clear and steady from the first screen. The goal is simple: less juggling, less forgetting, and fewer household tasks leaking into chat threads and mental overhead.
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              <BrandMark size={40} />
              <View style={styles.footerBrandCopy}>
                <Text style={styles.footerBrandTitle}>Jolly Home</Text>
                <Text style={styles.footerBrandBody}>Shared living, made calmer.</Text>
              </View>
            </View>

            <View style={styles.footerLinks}>
              <Pressable onPress={() => router.push('/landing')}>
                <Text style={styles.footerLink}>Home</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/terms')}>
                <Text style={styles.footerLink}>Terms & Conditions</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')}>
                <Text style={styles.footerLink}>GitHub</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F3ED',
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 48,
    gap: 22,
  },
  nav: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandCopy: {
    gap: 2,
  },
  brandOverline: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: '#786553',
  },
  brandName: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    color: '#211712',
    letterSpacing: -0.3,
  },
  navLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6E5948',
  },
  navLinkStrong: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A4A18',
  },
  navBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F1EBE3',
  },
  navPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B3E34',
  },
  headerBand: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5DDD3',
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerBandCopy: {
    gap: 4,
  },
  headerBandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241A15',
  },
  headerBandBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#625347',
  },
  hero: {
    zIndex: 1,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#E5DDD3',
    backgroundColor: '#FFFCF8',
    padding: 22,
    gap: 18,
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroStack: {
    flexDirection: 'column',
  },
  heroLeft: {
    gap: 16,
  },
  heroLeftWide: {
    flex: 1,
    paddingRight: 6,
  },
  heroRight: {
    justifyContent: 'center',
  },
  heroRightWide: {
    width: 420,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#F1EBE3',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6B5C4F',
  },
  title: {
    maxWidth: 680,
    fontSize: 54,
    lineHeight: 56,
    fontWeight: '700',
    color: '#221914',
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 700,
    fontSize: 23,
    lineHeight: 31,
    color: '#31241D',
  },
  supporting: {
    maxWidth: 620,
    fontSize: 15,
    lineHeight: 23,
    color: '#6B5A4E',
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#A04E1E',
  },
  secondaryButton: {
    backgroundColor: '#FFF9F3',
    borderWidth: 1,
    borderColor: '#DDC7B5',
  },
  ghostButton: {
    backgroundColor: '#E9DDD0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#241A15',
  },
  previewRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
  },
  previewRailStack: {
    flexDirection: 'column',
  },
  previewStep: {
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F1E7DB',
  },
  previewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0',
  },
  previewStepNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A14C1D',
  },
  previewStepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#4A3A2F',
  },
  jollyPanel: {
    minHeight: 360,
    borderRadius: 30,
    backgroundColor: '#EEF2EA',
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
  },
  jollyPanelCompact: {
    minHeight: 320,
  },
  jollySpeech: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,248,240,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  jollySpeechEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#896551',
  },
  jollySpeechTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: '#261B15',
  },
  jollySpeechBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#665449',
  },
  section: {
    zIndex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5D8CA',
    backgroundColor: '#FCF8F3',
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 18,
  },
  sectionTint: {
    backgroundColor: '#EEF1E6',
    borderColor: '#DDE2D1',
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: '#8A5D42',
  },
  sectionHeading: {
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '700',
    color: '#241A15',
    maxWidth: 760,
  },
  featureGrid: {
    gap: 14,
  },
  featureGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureGridStack: {
    flexDirection: 'column',
  },
  featureCard: {
    flex: 1,
    minWidth: 240,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#F3E7DB',
    gap: 8,
  },
  featureIllustration: {
    height: 72,
    borderRadius: 18,
    backgroundColor: '#FFF8F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureIllustrationOrb: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#F5EEE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F1',
  },
  featureTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: '#201712',
  },
  featureBlurb: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#43413C',
  },
  featureDetail: {
    fontSize: 13,
    lineHeight: 21,
    color: '#67564A',
  },
  accordionList: {
    gap: 12,
  },
  accordionCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1D8CE',
    padding: 16,
    gap: 12,
  },
  accordionCardOpen: {
    backgroundColor: '#FFF8F1',
    borderColor: '#E1C7AF',
  },
  accordionHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  accordionCopy: {
    flex: 1,
    gap: 3,
  },
  accordionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#231913',
  },
  accordionSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: '#645449',
  },
  accordionToggle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE6DC',
  },
  accordionToggleOpen: {
    backgroundColor: '#A14D1E',
  },
  accordionToggleText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
    color: '#5C4A3D',
  },
  accordionToggleTextOpen: {
    color: '#FFFFFF',
  },
  accordionContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4F4238',
  },
  footerBand: {
    backgroundColor: '#261C16',
    borderColor: '#3A2B22',
  },
  footerHeading: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '700',
    color: '#FFF6EE',
    maxWidth: 760,
  },
  footerBody: {
    maxWidth: 760,
    fontSize: 14,
    lineHeight: 22,
    color: '#DCCABD',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 18,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5DDD3',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerBrandCopy: {
    gap: 2,
  },
  footerBrandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241A15',
  },
  footerBrandBody: {
    fontSize: 13,
    color: '#625347',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A4A18',
  },
  cardPressed: {
    opacity: 0.92,
  },
});
