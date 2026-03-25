import type { NotificationFeatureRoute } from '@/types/notifications';

export type AssistantActionType = 'navigate' | 'create_shopping_item';
export type AssistantMessageRole = 'user' | 'assistant';

export interface AssistantSnapshot {
  householdName: string | null;
  dashboardHeadline: string;
  monthlySpendCents: number;
  topSpendCategory: string;
  openChoreTitles: string[];
  upcomingEventTitles: string[];
  lowStockTitles: string[];
  plannedMealTitles: string[];
  maintenanceTitles: string[];
  fairnessSummary: string[];
  spendingInsightSummaries: string[];
  activeShoppingListId: string | null;
}

export interface AssistantAction {
  id: string;
  type: AssistantActionType;
  label: string;
  description: string;
  route?: NotificationFeatureRoute;
  shoppingItemDraft?: {
    title: string;
    quantity: number | null;
    unit: string | null;
    category: string;
  };
}

export interface AssistantResponse {
  answer: string;
  facts: string[];
  actions: AssistantAction[];
}

export interface AssistantMessage {
  id: string;
  role: AssistantMessageRole;
  text: string;
  facts?: string[];
  actions?: AssistantAction[];
  createdAt: string;
}
