import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance',
    body:
      'By creating an account, accessing the app, or using the website, you agree to these Terms & Conditions. If you do not agree, do not use Jolly Home.',
  },
  {
    title: '2. Service Description',
    body:
      'Jolly Home provides shared-living tools for expenses, chores, calendars, meals, shopping, supplies, maintenance, house rules, and household coordination. Some features may change, improve, or be removed over time.',
  },
  {
    title: '3. Accounts and Responsibility',
    body:
      'You are responsible for the accuracy of the information you add to your household, for maintaining the security of your account, and for activity performed under your login.',
  },
  {
    title: '4. Acceptable Use',
    body:
      'You agree not to misuse the service, interfere with its operation, attempt unauthorized access, upload unlawful or harmful content, or use the product to harass, deceive, or harm other people.',
  },
  {
    title: '5. AI Features',
    body:
      'Jolly Home may provide AI-assisted suggestions, summaries, or extracted information. These outputs are provided for convenience and may be incomplete or incorrect, so users remain responsible for reviewing important actions before relying on them.',
  },
  {
    title: '6. Payments and Billing',
    body:
      'If paid plans, subscriptions, or premium features are offered, billing terms, pricing, and renewal terms will be shown at the point of purchase. Fees are generally non-refundable unless required by law or expressly stated otherwise.',
  },
  {
    title: '7. User Content',
    body:
      'You retain ownership of the content you submit, but you grant Jolly Home the rights reasonably necessary to host, process, display, and operate the service for your household.',
  },
  {
    title: '8. Third-Party Services',
    body:
      'The product may rely on third-party providers for payments, hosting, analytics, notifications, authentication, or integrations. Those services may have their own terms and privacy policies.',
  },
  {
    title: '9. Suspension and Termination',
    body:
      'We may suspend or terminate access if the service is misused, used unlawfully, or used in a way that risks harm to the platform or other users.',
  },
  {
    title: '10. Disclaimer',
    body:
      'Jolly Home is provided on an “as is” and “as available” basis. We do not guarantee uninterrupted availability, perfect accuracy, or fitness for every household use case.',
  },
  {
    title: '11. Limitation of Liability',
    body:
      'To the maximum extent permitted by law, Jolly Home will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the service.',
  },
  {
    title: '12. Changes to Terms',
    body:
      'We may update these Terms & Conditions from time to time. Continued use of the product after updated terms are posted means you accept the revised terms.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/landing')}>
            <Text style={styles.backLink}>Back to Jolly Home</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Terms & Conditions</Text>
          <Text style={styles.title}>Terms for using Jolly Home</Text>
          <Text style={styles.subtitle}>
            This draft is a product-ready baseline for the website and app. It should still be reviewed and finalized before public launch.
          </Text>
          <Text style={styles.updated}>Last updated: March 24, 2026</Text>
        </View>

        <View style={styles.panel}>
          {TERMS_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
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
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    gap: 10,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A4A18',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: '#8A5D42',
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '700',
    color: '#221914',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#625347',
    maxWidth: 760,
  },
  updated: {
    fontSize: 13,
    color: '#7A685A',
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E5DDD3',
    backgroundColor: '#FFFCF8',
    padding: 20,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: '#241A15',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 23,
    color: '#5A4C41',
  },
});
