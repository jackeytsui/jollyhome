describe('Auth', () => {
  describe('email sign-in', () => {
    it.todo('signs in with valid email and password');
    it.todo('returns error for invalid credentials');
    it.todo('maps Supabase error to user-friendly i18n message');
  });

  describe('email sign-up', () => {
    it.todo('creates account with email, password, and display name');
    it.todo('sets emailConfirmationRequired when email not verified');
  });

  describe('oauth', () => {
    it.todo('initiates Google OAuth with correct provider and redirect');
    it.todo('initiates Apple OAuth with correct provider and redirect');
    it.todo('exchanges code for session on successful OAuth callback');
  });

  describe('magic link', () => {
    it.todo('sends OTP email with correct redirect URL');
    it.todo('returns success flag when email sent');
  });

  describe('password reset', () => {
    it.todo('sends password reset email with correct redirect');
  });

  describe('sign out', () => {
    it.todo('calls supabase.auth.signOut');
  });
});
