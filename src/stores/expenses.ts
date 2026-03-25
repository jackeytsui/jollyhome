import { createMMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware.js';
import type { CreateExpenseInput, ExpenseFilters } from '@/types/expenses';

// ============================================================
// MMKV storage for offline queue persistence
// ============================================================

const createExpenseStorage = () => {
  if (typeof window === 'undefined') {
    const memoryStorage = new Map<string, string>();
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    };
  }

  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: (key: string) => window.localStorage.removeItem(key),
    };
  }

  const expenseStorage = createMMKV({ id: 'expense-queue' });
  return {
    getItem: (key: string) => expenseStorage.getString(key) ?? null,
    setItem: (key: string, value: string) => expenseStorage.set(key, value),
    removeItem: (key: string) => expenseStorage.remove(key),
  };
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
      storage: createJSONStorage(createExpenseStorage),
      // Only persist the offline queue — filters should reset on app restart
      partialize: (state) => ({ offlineQueue: state.offlineQueue }),
    }
  )
);
