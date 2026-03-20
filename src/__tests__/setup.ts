// Mock Supabase client (virtual: true because src/lib/supabase.ts does not exist yet in Wave 0)
jest.mock(
  '@/lib/supabase',
  () => ({
    supabase: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signInWithOtp: jest.fn(),
        signInWithOAuth: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        }),
        resetPasswordForEmail: jest.fn(),
        exchangeCodeForSession: jest.fn(),
        resend: jest.fn(),
        mfa: {
          enroll: jest.fn(),
          challenge: jest.fn(),
          verify: jest.fn(),
          unenroll: jest.fn(),
          getAuthenticatorAssuranceLevel: jest.fn(),
          listFactors: jest.fn(),
        },
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  }),
  { virtual: true }
);

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
    setLogLevel: jest.fn(),
  },
  LOG_LEVEL: { VERBOSE: 'VERBOSE' },
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC: 2 },
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `jolly-home://${path}`),
}));

// Mock react-native Share
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}));
