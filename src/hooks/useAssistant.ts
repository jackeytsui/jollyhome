import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildAssistantSnapshot, buildGroundedAssistantResponse } from '@/lib/assistantActions';
import type { ShoppingCategoryKey } from '@/types/shopping';
import type { AssistantAction, AssistantMessage, AssistantSnapshot } from '@/types/assistant';

interface UseAssistantOptions {
  householdId: string | null;
  snapshot: AssistantSnapshot;
  activeShoppingListId: string | null;
  createShoppingList: (input: { title: string }) => Promise<string>;
  createShoppingItem: (input: {
    listId: string;
    title: string;
    quantity?: number | null;
    unit?: string | null;
    category?: ShoppingCategoryKey;
  }) => Promise<void>;
}

function createMessage(message: Omit<AssistantMessage, 'id' | 'createdAt'>): AssistantMessage {
  return {
    ...message,
    id: `${message.role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
}

export function useAssistant(options: UseAssistantOptions) {
  const { householdId, snapshot, activeShoppingListId, createShoppingItem, createShoppingList } = options;
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groundedSnapshot = useMemo(() => buildAssistantSnapshot(snapshot), [snapshot]);

  const openAssistant = useCallback(() => {
    setVisible(true);
    setError(null);
    setMessages((current) => current.length > 0
      ? current
      : [
        createMessage({
          role: 'assistant',
          text: `Ask about spending, chores, meals, pantry stock, calendar plans, or maintenance and I’ll answer from the current household snapshot.`,
          facts: [groundedSnapshot.dashboardHeadline],
          actions: [],
        }),
      ]);
  }, [groundedSnapshot.dashboardHeadline]);

  const closeAssistant = useCallback(() => {
    setVisible(false);
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || !householdId) {
      return;
    }

    const userMessage = createMessage({
      role: 'user',
      text: trimmed,
    });

    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('household-assistant', {
        body: {
          household_id: householdId,
          message: trimmed,
          snapshot: groundedSnapshot,
        },
      });

      if (fnError) {
        throw fnError;
      }

      const response = (data ?? buildGroundedAssistantResponse(trimmed, groundedSnapshot)) as {
        answer: string;
        facts?: string[];
        actions?: AssistantAction[];
      };

      setMessages((current) => [
        ...current,
        createMessage({
          role: 'assistant',
          text: response.answer,
          facts: response.facts ?? [],
          actions: response.actions ?? [],
        }),
      ]);
    } catch (err) {
      const fallback = buildGroundedAssistantResponse(trimmed, groundedSnapshot);
      setError(err instanceof Error ? err.message : 'Assistant request failed');
      setMessages((current) => [
        ...current,
        createMessage({
          role: 'assistant',
          text: fallback.answer,
          facts: fallback.facts,
          actions: fallback.actions,
        }),
      ]);
    } finally {
      setLoading(false);
    }
  }, [groundedSnapshot, householdId]);

  const executeAction = useCallback(async (action: AssistantAction): Promise<{ route?: string | undefined }> => {
    if (action.type === 'navigate') {
      return { route: action.route };
    }

    if (action.type === 'create_shopping_item' && action.shoppingItemDraft) {
      const draft = action.shoppingItemDraft;
      const listId = activeShoppingListId ?? await createShoppingList({ title: 'Household list' });
      await createShoppingItem({
        listId,
        title: draft.title,
        quantity: draft.quantity,
        unit: draft.unit,
        category: draft.category as ShoppingCategoryKey,
      });

      setMessages((current) => [
        ...current,
        createMessage({
          role: 'assistant',
          text: `${draft.title} was added to the shopping list as a pending item.`,
          facts: ['Action completed through the existing shopping flow.'],
          actions: [
            {
              id: `open-shopping-${action.id}`,
              type: 'navigate',
              label: 'Open shopping',
              description: 'Review the updated list.',
              route: '/(app)/shopping',
            },
          ],
        }),
      ]);

      return { route: '/(app)/shopping' };
    }

    return {};
  }, [activeShoppingListId, createShoppingItem, createShoppingList]);

  return {
    visible,
    loading,
    error,
    messages,
    openAssistant,
    closeAssistant,
    sendMessage,
    executeAction,
  };
}
