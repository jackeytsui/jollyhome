import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  uri?: string;
  initials?: string;
  size?: AvatarSize;
  selected?: boolean;
}

const sizePx: Record<AvatarSize, number> = {
  sm: 40,
  md: 64,
  lg: 96,
};

const fontSizePx: Record<AvatarSize, number> = {
  sm: 16,
  md: 24,
  lg: 36,
};

// Simple color palette for initials avatars based on initials character
const initialsColors = [
  '#F97316', // accent
  '#16A34A', // success
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
];

function getColorForInitials(initials: string): string {
  const code = (initials.charCodeAt(0) || 0) % initialsColors.length;
  return initialsColors[code];
}

export function Avatar({ uri, initials = '?', size = 'md', selected = false }: AvatarProps) {
  const dimension = sizePx[size];
  const fontSize = fontSizePx[size];
  const borderColor = selected ? colors.accent.light : 'transparent';
  const borderWidth = selected ? 2 : 0;

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      borderColor,
      borderWidth,
    },
  ];

  if (uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri }}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const bgColor = getColorForInitials(initials);

  return (
    <View
      style={[
        containerStyle,
        { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize, color: '#FFFFFF' }]}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
