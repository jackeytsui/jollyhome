import React from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

const FEATURE_PANELS = [
  {
    title: 'Money and receipts',
    body: 'Split expenses, scan receipts, settle balances, and keep the household ledger visible.',
  },
  {
    title: 'Chores and fairness',
    body: 'Track chore load, condition bars, fairness, and assistive rotation without queue breakage.',
  },
  {
    title: 'Meals, shopping, supplies',
    body: 'Plan meals, generate shopping lists, track stock, and keep pantry decisions connected.',
  },
  {
    title: 'Calendar and coordination',
    body: 'Run one unified household timeline for events, meals, maintenance, guests, rules, and bookings.',
  },
];

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Household operating system</Text>
          </View>
          <Text style={styles.title}>Jolly Home</Text>
          <Text style={styles.subtitle}>
            One app for shared living: expenses, chores, meals, supplies, calendar, maintenance, rules, and household AI.
          </Text>
          <Text style={styles.supporting}>
            Built for roommates, couples, and families who want one connected system instead of a stack of disconnected apps.
          </Text>

          <View style={styles.ctaRow}>
            <Pressable style={[styles.button, styles.primaryButton]} onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.primaryButtonText}>Create account</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.secondaryButtonText}>Sign in</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => Linking.openURL('https://github.com/jackeytsui/jollyhome')}>
            <Text style={styles.linkText}>View the project on GitHub</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What the product already covers</Text>
          <View style={styles.grid}>
            {FEATURE_PANELS.map((panel) => (
              <View key={panel.title} style={styles.panel}>
                <Text style={styles.panelTitle}>{panel.title}</Text>
                <Text style={styles.panelBody}>{panel.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why it feels different</Text>
          <Text style={styles.paragraph}>
            Jolly Home is not just a bundle of utilities. Receipts can update expenses, pantry stock, and shopping state.
            Calendar context feeds meals and chores. The dashboard and assistant read the same household graph instead of inventing
            disconnected summaries.
          </Text>
          <Text style={styles.paragraph}>
            The current launch track is focused on release hardening: public web presence, deployment setup, CI, launch docs, and
            shipping discipline around app and web readiness.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 24,
    gap: 28,
  },
  hero: {
    gap: 14,
    paddingVertical: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary.light,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary.light,
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary.light,
    maxWidth: 760,
  },
  supporting: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary.light,
    maxWidth: 760,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  button: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent.light,
  },
  secondaryButton: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  linkText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  panel: {
    width: '48%',
    minWidth: 260,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    padding: 16,
    gap: 8,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary.light,
    maxWidth: 820,
  },
});
