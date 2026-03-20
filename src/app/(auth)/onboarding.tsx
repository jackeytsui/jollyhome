import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
  ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createMMKV } from 'react-native-mmkv';
import { OnboardingCard } from '@/components/auth/OnboardingCard';
import { captureEvent } from '@/lib/posthog';
import { colors } from '@/constants/theme';

const onboardingStorage = createMMKV({ id: 'onboarding' });
const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';

interface CardData {
  id: string;
  heading: string;
  body: string;
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<CardData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const skippedAtRef = useRef<number | null>(null);

  const cards: CardData[] = [
    {
      id: 'card1',
      heading: t('onboarding.card1.heading'),
      body: t('onboarding.card1.body'),
    },
    {
      id: 'card2',
      heading: t('onboarding.card2.heading'),
      body: t('onboarding.card2.body'),
    },
    {
      id: 'card3',
      heading: t('onboarding.card3.heading'),
      body: t('onboarding.card3.body'),
    },
  ];

  const completeOnboarding = useCallback(
    (skippedAt: number | null = null) => {
      onboardingStorage.set(ONBOARDING_COMPLETE_KEY, true);
      captureEvent('onboarding_completed', {
        skipped_at_card: skippedAt,
      });
      router.replace('/(app)/create-household');
    },
    []
  );

  const handleSkip = useCallback(() => {
    skippedAtRef.current = currentIndex + 1;
    completeOnboarding(currentIndex + 1);
  }, [currentIndex, completeOnboarding]);

  const handleContinue = useCallback(() => {
    completeOnboarding(null);
  }, [completeOnboarding]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CardData>) => (
      <View style={{ width }}>
        <OnboardingCard
          heading={item.heading}
          body={item.body}
          isLast={index === cards.length - 1}
          onContinue={handleContinue}
        />
      </View>
    ),
    [width, cards.length, handleContinue]
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip button — shown on every card */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('cta.skip')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flex}
      />

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        {cards.map((card, index) => (
          <View
            key={card.id}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  flex: {
    flex: 1,
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.accent.light,
    width: 24,
  },
  dotInactive: {
    backgroundColor: colors.border.light,
  },
});
