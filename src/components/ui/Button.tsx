import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: {
    bg: colors.accent.light,
    text: '#FFFFFF',
  },
  secondary: {
    bg: colors.secondary.light,
    text: colors.textPrimary.light,
  },
  ghost: {
    bg: 'transparent',
    text: colors.textPrimary.light,
  },
  destructive: {
    bg: colors.destructive.light,
    text: '#FFFFFF',
  },
};

const sizeStyles: Record<ButtonSize, { minHeight: number; paddingH: number; fontSize: number }> = {
  sm: { minHeight: 44, paddingH: 12, fontSize: 14 },
  md: { minHeight: 44, paddingH: 16, fontSize: 14 },
  lg: { minHeight: 52, paddingH: 20, fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          {
            backgroundColor: variantStyle.bg,
            minHeight: sizeStyle.minHeight,
            paddingHorizontal: sizeStyle.paddingH,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variantStyle.text} />
        ) : (
          <Text
            style={[
              styles.label,
              { color: variantStyle.text, fontSize: sizeStyle.fontSize },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    fontWeight: '600',
    lineHeight: 20,
  },
});
