describe('Invite', () => {
  describe('generate', () => {
    it.todo('creates invite with token and returns invite URL');
    it.todo('sets expires_at based on household config');
    it.todo('generates valid deep link URL with token');
  });

  describe('approval', () => {
    it.todo('sets member status to pending when approval required');
    it.todo('sets member status to active when no approval required');
    it.todo('admin can approve pending member');
  });

  describe('redeem', () => {
    it.todo('joins household on valid invite');
    it.todo('redirects unauthenticated user to sign-up with returnTo');
    it.todo('sets active household after join');
  });

  describe('expiry', () => {
    it.todo('rejects expired invite token');
    it.todo('rejects invite that has reached max uses');
    it.todo('accepts valid non-expired invite');
  });
});
