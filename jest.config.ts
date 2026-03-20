import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-reanimated|react-native-mmkv|@supabase/.*|react-native-qrcode-svg|@gorhom/.*|lucide-react-native|posthog-react-native|react-native-purchases|react-native-worklets)',
  ],
  setupFilesAfterEnv: ['./src/__tests__/setup.ts'],
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
