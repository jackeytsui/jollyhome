import type { ShoppingCategoryKey } from '@/types/shopping';
import type { AssistantAction, AssistantResponse, AssistantSnapshot } from '@/types/assistant';

function normalizeCategory(title: string): ShoppingCategoryKey {
  const text = title.toLowerCase();
  if (/(milk|yogurt|cheese|egg)/.test(text)) {
    return 'dairy';
  }
  if (/(apple|banana|lettuce|tomato|onion)/.test(text)) {
    return 'produce';
  }
  if (/(soap|detergent|paper|sponge|trash)/.test(text)) {
    return 'household';
  }
  return 'pantry';
}

function createNavigateAction(
  id: string,
  label: string,
  description: string,
  route: AssistantAction['route']
): AssistantAction {
  return {
    id,
    type: 'navigate',
    label,
    description,
    route,
  };
}

function createShoppingItemAction(title: string): AssistantAction {
  return {
    id: `shop-${title.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'create_shopping_item',
    label: `Add ${title}`,
    description: 'Create a pending shopping item from this assistant suggestion.',
    route: '/(app)/shopping',
    shoppingItemDraft: {
      title,
      quantity: 1,
      unit: null,
      category: normalizeCategory(title),
    },
  };
}

export function buildAssistantSnapshot(input: AssistantSnapshot): AssistantSnapshot {
  return input;
}

export function buildGroundedAssistantResponse(message: string, snapshot: AssistantSnapshot): AssistantResponse {
  const query = message.trim().toLowerCase();
  const householdLabel = snapshot.householdName ?? 'Your household';

  if (/(spend|expense|budget|money|cost)/.test(query)) {
    return {
      answer: `${householdLabel} has spent $${(snapshot.monthlySpendCents / 100).toFixed(2)} this month, with ${snapshot.topSpendCategory} as the largest category right now.`,
      facts: [
        `Top spending category: ${snapshot.topSpendCategory}`,
        ...snapshot.spendingInsightSummaries.slice(0, 2),
      ],
      actions: [
        createNavigateAction('go-finances', 'Open finances', 'Review expenses, balances, and category history.', '/(app)/finances'),
      ],
    };
  }

  if (/(chore|clean|task|fair)/.test(query)) {
    return {
      answer: snapshot.openChoreTitles.length > 0
        ? `${snapshot.openChoreTitles.length} chores still need attention. ${snapshot.openChoreTitles.slice(0, 2).join(' and ')} are the clearest next items.`
        : 'No chores are currently open, and the household queue looks clear right now.',
      facts: [
        ...snapshot.fairnessSummary.slice(0, 2),
        ...snapshot.openChoreTitles.slice(0, 2).map((title) => `Open chore: ${title}`),
      ],
      actions: [
        createNavigateAction('go-chores', 'Open chores', 'Review assignments, queue, and fairness details.', '/(app)/chores'),
      ],
    };
  }

  if (/(meal|dinner|cook|recipe)/.test(query)) {
    return {
      answer: snapshot.plannedMealTitles.length > 0
        ? `${snapshot.plannedMealTitles.length} meals are already planned. ${snapshot.plannedMealTitles.slice(0, 2).join(' and ')} are next on the board.`
        : 'No meals are planned yet, so the meal board is the next place to organize dinner decisions.',
      facts: snapshot.plannedMealTitles.slice(0, 3).map((title) => `Planned meal: ${title}`),
      actions: [
        createNavigateAction('go-meals', 'Open meals', 'Review the weekly board, recipes, and AI meal planner.', '/(app)/meals'),
      ],
    };
  }

  if (/(pantry|stock|grocery|shopping|suppl)/.test(query)) {
    const firstLowStock = snapshot.lowStockTitles[0];
    return {
      answer: snapshot.lowStockTitles.length > 0
        ? `${snapshot.lowStockTitles.length} stock alerts are open. ${snapshot.lowStockTitles.slice(0, 2).join(' and ')} are the clearest restock candidates.`
        : 'No pantry or household stock alerts are currently open.',
      facts: snapshot.lowStockTitles.slice(0, 3).map((title) => `Low stock: ${title}`),
      actions: [
        ...(firstLowStock ? [createShoppingItemAction(firstLowStock)] : []),
        createNavigateAction('go-shopping', 'Open shopping', 'Review shared lists and aisle-grouped items.', '/(app)/shopping'),
      ],
    };
  }

  if (/(repair|maint|fix)/.test(query)) {
    return {
      answer: snapshot.maintenanceTitles.length > 0
        ? `${snapshot.maintenanceTitles.length} maintenance requests are active. ${snapshot.maintenanceTitles.slice(0, 2).join(' and ')} are currently in motion.`
        : 'There are no active maintenance requests at the moment.',
      facts: snapshot.maintenanceTitles.slice(0, 3).map((title) => `Active maintenance: ${title}`),
      actions: [
        createNavigateAction('go-maintenance', 'Open maintenance', 'Review repair status, appointments, and history.', '/(app)/maintenance'),
      ],
    };
  }

  if (/(calendar|schedule|coming up|event|booking)/.test(query)) {
    return {
      answer: snapshot.upcomingEventTitles.length > 0
        ? `${snapshot.upcomingEventTitles.length} household events are coming up. ${snapshot.upcomingEventTitles.slice(0, 2).join(' and ')} are next on the timeline.`
        : 'The household timeline is relatively quiet right now.',
      facts: snapshot.upcomingEventTitles.slice(0, 3).map((title) => `Upcoming: ${title}`),
      actions: [
        createNavigateAction('go-calendar', 'Open calendar', 'Review the unified household timeline.', '/(app)/calendar'),
      ],
    };
  }

  return {
    answer: `${householdLabel} is tracking chores, calendar, pantry, maintenance, meals, and spending in one place. Ask about any one of those areas and I’ll answer from the current household snapshot.`,
    facts: [
      snapshot.dashboardHeadline,
      ...snapshot.spendingInsightSummaries.slice(0, 1),
      ...snapshot.fairnessSummary.slice(0, 1),
    ],
    actions: [
      createNavigateAction('go-home-finances', 'Review finances', 'Check balances and spending insights.', '/(app)/finances'),
      createNavigateAction('go-home-chores', 'Review chores', 'Check the active queue and fairness.', '/(app)/chores'),
    ],
  };
}
