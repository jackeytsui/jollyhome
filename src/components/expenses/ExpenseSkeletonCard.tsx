import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

function ShimmerBar({ width, height = 14 }: { width: number | string; height?: number }) {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(-screenWidth);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(screenWidth, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [screenWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.shimmerContainer,
        { width: width as number, height, borderRadius: height / 2 },
      ]}
    >
      <Animated.View style={[styles.shimmerHighlight, animatedStyle]} />
    </View>
  );
}

export function ExpenseSkeletonCard() {
  return (
    <View style={styles.card}>
      {/* Category icon placeholder */}
      <View style={styles.iconPlaceholder} />

      {/* Content */}
      <View style={styles.content}>
        <ShimmerBar width={160} height={16} />
        <ShimmerBar width={80} height={12} />
      </View>

      {/* Amount */}
      <View style={styles.rightSection}>
        <ShimmerBar width={60} height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.border.light,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  rightSection: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  shimmerContainer: {
    backgroundColor: colors.border.light,
    overflow: 'hidden',
  },
  shimmerHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
