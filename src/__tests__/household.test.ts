describe('Household', () => {
  describe('create', () => {
    it.todo('creates household and returns new household object');
    it.todo('adds creator as admin member');
    it.todo('sets created household as active household');
    it.todo('updates profile active_household_id');
  });

  describe('roles', () => {
    it.todo('admin can promote member to admin');
    it.todo('admin can demote admin to member');
    it.todo('non-admin cannot change roles');
  });

  describe('leave', () => {
    it.todo('member can leave household');
    it.todo('clears active_household_id on leave');
    it.todo('warns if last admin tries to leave');
  });
});
