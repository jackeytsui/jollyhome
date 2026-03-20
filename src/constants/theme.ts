export const colors = {
  dominant: { light: '#FFF8F0', dark: '#1A1612' },
  secondary: { light: '#F5EDE0', dark: '#2C2420' },
  accent: { light: '#F97316', dark: '#FB923C' },
  destructive: { light: '#DC2626', dark: '#EF4444' },
  success: { light: '#16A34A', dark: '#22C55E' },
  textPrimary: { light: '#1A1612', dark: '#FAF5F0' },
  textSecondary: { light: '#78716C', dark: '#A8A29E' },
  border: { light: '#E7D9C8', dark: '#3D3530' },
  sandbox: { light: '#CA8A04', dark: '#EAB308' },
} as const;

export type ColorKey = keyof typeof colors;
export type ColorMode = 'light' | 'dark';
