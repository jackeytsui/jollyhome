import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { OnboardingStep } from '@/lib/onboarding';

interface OnboardingFlowSheetProps {
  visible: boolean;
  steps: OnboardingStep[];
  onClose: () => void;
  onComplete: () => void;
  onOpenRoute: (route: OnboardingStep['route']) => void;
}

export function OnboardingFlowSheet(props: OnboardingFlowSheetProps) {
  const { visible, steps, onClose, onComplete, onOpenRoute } = props;

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Connected onboarding</Text>
            <Text style={styles.subtitle}>Start from the household picture first, then drill into the workflows from there.</Text>

            {steps.map((step, index) => (
              <Card key={step.id} style={styles.stepCard}>
                <Text style={styles.stepIndex}>Step {index + 1}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
                {step.route ? (
                  <Button
                    label="Open related view"
                    variant="secondary"
                    onPress={() => onOpenRoute(step.route)}
                  />
                ) : null}
              </Card>
            ))}

            <View style={styles.actions}>
              <Button label="Close" variant="secondary" onPress={onClose} />
              <Button label="Done" onPress={onComplete} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 22, 18, 0.42)',
  },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  stepCard: {
    gap: 8,
  },
  stepIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
