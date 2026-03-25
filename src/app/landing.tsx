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
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
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

const serifFamily = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : undefined;
const sansFamily = Platform.OS === 'web' ? '"Avenir Next", "Segoe UI", sans-serif' : undefined;

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
      <View style={styles.jollyGlow} />
      <Svg width={compact ? 240 : 320} height={compact ? 240 : 320} viewBox="0 0 320 320" fill="none">
        <Circle cx="160" cy="160" r="108" fill="#F0E5D8" />
        <Ellipse cx="160" cy="132" rx="76" ry="70" fill="#FFF9F2" />
        <Path d="M104 118C108 88 130 70 160 70C190 70 212 88 216 118C203 99 184 90 160 90C136 90 117 99 104 118Z" fill="#D8E4DB" />
        <Ellipse cx="132" cy="142" rx="21" ry="24" fill="#FFFFFF" />
        <Ellipse cx="188" cy="142" rx="21" ry="24" fill="#FFFFFF" />
        <Circle cx="136" cy="145" r="9" fill="#234C53" />
        <Circle cx="184" cy="145" r="9" fill="#234C53" />
        <Circle cx="132" cy="141" r="3" fill="#FFF9F2" />
        <Circle cx="180" cy="141" r="3" fill="#FFF9F2" />
        <Ellipse cx="160" cy="174" rx="10" ry="8" fill="#F5C4A6" />
        <Path d="M136 196C143 207 151 212 160 212C169 212 177 207 184 196" stroke="#A34E20" strokeWidth="8" strokeLinecap="round" />
        <Path d="M160 52V72" stroke="#234C53" strokeWidth="7" strokeLinecap="round" />
        <Circle cx="160" cy="40" r="12" fill="#A34E20" />
        <Rect x="112" y="226" width="96" height="48" rx="24" fill="#234C53" />
        <Rect x="132" y="218" width="56" height="22" rx="11" fill="#FFF9F2" />
        <Path d="M103 236C120 224 139 218 160 218C181 218 200 224 217 236" stroke="#FFF9F2" strokeWidth="8" strokeLinecap="round" />
        <Path d="M118 238L97 260" stroke="#234C53" strokeWidth="8" strokeLinecap="round" />
        <Path d="M202 238L223 260" stroke="#234C53" strokeWidth="8" strokeLinecap="round" />
      </Svg>
      <View style={styles.jollySpeech}>
        <Text style={styles.jollySpeechEyebrow}>Meet Jolly</Text>
        <Text style={styles.jollySpeechTitle}>Friendly guide, light tech feel, easy to trust.</Text>
        <Text style={styles.jollySpeechBody}>
          Jolly is the face of the product: a warm little helper for the house, designed to feel approachable before it feels technical.
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
          <View style={styles.glowLarge} />
          <View style={styles.glowSmall} />

          <View style={styles.nav}>
            <View style={styles.brand}>
              <BrandMark size={52} />
              <View style={styles.brandCopy}>
                <Text style={[styles.brandName, { fontFamily: serifFamily }]}>Jolly Home</Text>
              </View>
            </View>

            <Pressable onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')}>
              <Text style={styles.githubLink}>GitHub</Text>
            </Pressable>
          </View>

          <View style={[styles.hero, isWide ? styles.heroWide : styles.heroStack]}>
            <View style={[styles.heroLeft, isWide && styles.heroLeftWide]}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>A calmer way to run a shared home</Text>
              </View>

              <Text style={[styles.title, { fontFamily: serifFamily }]}>
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
            <Text style={[styles.sectionHeading, { fontFamily: serifFamily }]}>The feature story is simple.</Text>
            <View style={[styles.featureGrid, isWide ? styles.featureGridWide : styles.featureGridStack]}>
              {featureRows.map((item) => (
                <View key={item.title} style={styles.featureCard}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureBlurb}>{item.blurb}</Text>
                  <Text style={styles.featureDetail}>{item.details}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.section, styles.sectionTint]}>
            <Text style={[styles.sectionEyebrow, { fontFamily: sansFamily }]}>Tap to explore</Text>
            <Text style={[styles.sectionHeading, { fontFamily: serifFamily }]}>A clearer way to explain the product.</Text>
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
            <Text style={[styles.sectionEyebrow, { fontFamily: sansFamily }]}>Why the brand matters</Text>
            <Text style={[styles.footerHeading, { fontFamily: serifFamily }]}>Jolly should feel like a helpful friend in the home, not a backend product talking to users.</Text>
            <Text style={styles.footerBody}>
              This page now avoids backend-heavy language, removes stock-photo energy, and centers the product around what people actually feel:
              clarity, calm, and a sense that the home is being taken care of.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5EFE7',
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
  glowLarge: {
    position: 'absolute',
    top: 72,
    right: -20,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#F3C7A0',
    opacity: 0.35,
  },
  glowSmall: {
    position: 'absolute',
    left: -30,
    top: 280,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: '#D6E1D5',
    opacity: 0.6,
  },
  nav: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
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
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
    color: '#211712',
  },
  githubLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A4A18',
  },
  hero: {
    zIndex: 1,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#E6D6C8',
    backgroundColor: '#FCF8F3',
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
    borderRadius: 999,
    backgroundColor: '#EEE3D6',
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
    fontSize: 58,
    lineHeight: 60,
    fontWeight: '700',
    color: '#221914',
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
    backgroundColor: '#E4EADF',
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
  },
  jollyPanelCompact: {
    minHeight: 320,
  },
  jollyGlow: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#F2C497',
    opacity: 0.4,
  },
  jollySpeech: {
    marginTop: -10,
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
    borderColor: '#D9DDCF',
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
  cardPressed: {
    opacity: 0.92,
  },
});
