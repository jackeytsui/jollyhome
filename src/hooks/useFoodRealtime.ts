import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const FOOD_REALTIME_TABLES = [
  'food_catalog_items',
  'shopping_lists',
  'shopping_list_items',
  'inventory_items',
  'inventory_events',
  'inventory_alerts',
  'recipes',
  'recipe_ingredients',
  'meal_plan_entries',
  'meal_suggestion_runs',
  'meal_suggestion_feedback',
] as const;

export const FOOD_REALTIME_CHANNEL_NAME = (householdId: string) => `household:${householdId}:food`;

type FoodRefreshHandler = () => void | Promise<void>;

interface FoodRealtimeEntry {
  channel: ReturnType<typeof supabase.channel>;
  listeners: Set<FoodRefreshHandler>;
  refCount: number;
}

const foodRealtimeRegistry = new Map<string, FoodRealtimeEntry>();

function notifyListeners(householdId: string) {
  const entry = foodRealtimeRegistry.get(householdId);
  if (!entry) {
    return;
  }

  for (const listener of entry.listeners) {
    listener();
  }
}

function createFoodChannel(householdId: string) {
  let channel = supabase.channel(FOOD_REALTIME_CHANNEL_NAME(householdId));

  for (const table of FOOD_REALTIME_TABLES) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `household_id=eq.${householdId}`,
      },
      () => notifyListeners(householdId)
    );
  }

  channel.subscribe();
  return channel;
}

export function subscribeFoodRealtime(householdId: string | null, onRefresh: FoodRefreshHandler) {
  if (!householdId) {
    return () => {};
  }

  let entry = foodRealtimeRegistry.get(householdId);
  if (!entry) {
    entry = {
      channel: createFoodChannel(householdId),
      listeners: new Set(),
      refCount: 0,
    };
    foodRealtimeRegistry.set(householdId, entry);
  }

  entry.listeners.add(onRefresh);
  entry.refCount += 1;

  return () => {
    const current = foodRealtimeRegistry.get(householdId);
    if (!current) {
      return;
    }

    current.listeners.delete(onRefresh);
    current.refCount -= 1;

    if (current.refCount <= 0) {
      supabase.removeChannel(current.channel);
      foodRealtimeRegistry.delete(householdId);
    }
  };
}

export function useFoodRealtime(householdId: string | null, onRefresh: FoodRefreshHandler) {
  useEffect(() => subscribeFoodRealtime(householdId, onRefresh), [householdId, onRefresh]);
}

export function __resetFoodRealtimeRegistryForTests() {
  for (const entry of foodRealtimeRegistry.values()) {
    supabase.removeChannel(entry.channel);
  }
  foodRealtimeRegistry.clear();
}
