import { create } from 'zustand';

interface HouseholdState {
  activeHouseholdId: string | null;
  householdName: string | null;
  memberCount: number;
  userRole: 'admin' | 'member' | null;
  setActiveHousehold: (
    id: string | null,
    name: string | null,
    role: 'admin' | 'member' | null
  ) => void;
  setMemberCount: (count: number) => void;
  reset: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  activeHouseholdId: null,
  householdName: null,
  memberCount: 0,
  userRole: null,
  setActiveHousehold: (id, name, role) =>
    set({ activeHouseholdId: id, householdName: name, userRole: role }),
  setMemberCount: (count) => set({ memberCount: count }),
  reset: () => set({ activeHouseholdId: null, householdName: null, memberCount: 0, userRole: null }),
}));
