import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface JollyParsingIndicatorProps {
  visible: boolean;
}

const DOT_SIZE = 6;
const DOT_SPACING = 4;
const CYCLE_MS = 400;
const STAGGER_MS = 133;

function AnimatedDot({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: CYCLE_MS / 2 }),
          withTiming(0.3, { duration: CYCLE_MS / 2 })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(opacity);
      opacity.value = 0.3;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function JollyParsingIndicator({ visible }: JollyParsingIndicatorProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Sparkles size={16} color={colors.accent.light} />
      <View style={styles.dots}>
        <AnimatedDot index={0} />
        <AnimatedDot index={1} />
        <AnimatedDot index={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 24,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOT_SPACING,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.accent.light,
  },
});
