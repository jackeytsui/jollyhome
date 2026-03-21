import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CreateExpenseInput, ExpenseFilters } from '@/types/expenses';

// ============================================================
// MMKV storage for offline queue persistence
// ============================================================

const expenseStorage = createMMKV({ id: 'expense-queue' });

const mmkvStorage = {
  getItem: (key: string) => expenseStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => expenseStorage.set(key, value),
  removeItem: (key: string) => expenseStorage.remove(key),
};

// ============================================================
// Types
// ============================================================

interface QueuedExpense {
  localId: string;
  data: CreateExpenseInput;
  queuedAt: string;
}

interface ExpenseState {
  offlineQueue: QueuedExpense[];
  activeFilters: ExpenseFilters;
  enqueue: (expense: CreateExpenseInput) => void;
  dequeue: (localId: string) => void;
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  clearFilters: () => void;
  clearQueue: () => void;
}

// ============================================================
// Default filter state (all null — no filters active)
// ============================================================

const DEFAULT_FILTERS: ExpenseFilters = {
  dateFrom: null,
  dateTo: null,
  category: null,
  memberId: null,
  amountMin: null,
  amountMax: null,
  search: null,
};

// ============================================================
// Zustand store with MMKV persistence
// Only offlineQueue is persisted — activeFilters reset on app restart
// ============================================================

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      offlineQueue: [],
      activeFilters: DEFAULT_FILTERS,

      enqueue: (expense) =>
        set((state) => ({
          offlineQueue: [
            ...state.offlineQueue,
            {
              localId: Date.now().toString(),
              data: expense,
              queuedAt: new Date().toISOString(),
            },
          ],
        })),

      dequeue: (localId) =>
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((q) => q.localId !== localId),
        })),

      setFilters: (filters) =>
        set((state) => ({
          activeFilters: { ...state.activeFilters, ...filters },
        })),

      clearFilters: () => set({ activeFilters: DEFAULT_FILTERS }),

      clearQueue: () => set({ offlineQueue: [] }),
    }),
    {
      name: 'expense-queue',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the offline queue — filters should reset on app restart
      partialize: (state) => ({ offlineQueue: state.offlineQueue }),
    }
  )
);
