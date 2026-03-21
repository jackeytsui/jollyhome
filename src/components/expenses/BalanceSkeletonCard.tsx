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

export function BalanceSkeletonCard() {
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
    <View style={styles.card}>
      <View style={styles.shimmerContainer}>
        <Animated.View style={[styles.shimmerHighlight, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  shimmerContainer: {
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border.light,
    overflow: 'hidden',
    width: '60%',
  },
  shimmerHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
