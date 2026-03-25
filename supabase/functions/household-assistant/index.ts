// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeCategory(title: string) {
  const text = title.toLowerCase();
  if (/(milk|yogurt|cheese|egg)/.test(text)) return 'dairy';
  if (/(apple|banana|lettuce|tomato|onion)/.test(text)) return 'produce';
  if (/(soap|detergent|paper|sponge|trash)/.test(text)) return 'household';
  return 'pantry';
}

function navigate(id: string, label: string, description: string, route: string) {
  return { id, type: 'navigate', label, description, route };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, snapshot } = await req.json() as {
      household_id: string;
      message: string;
      snapshot: Record<string, unknown>;
    };

    const query = String(message ?? '').toLowerCase();
    const householdName = String(snapshot.householdName ?? 'Your household');
    const monthlySpendCents = Number(snapshot.monthlySpendCents ?? 0);
    const topSpendCategory = String(snapshot.topSpendCategory ?? 'Uncategorized');
    const openChoreTitles = Array.isArray(snapshot.openChoreTitles) ? snapshot.openChoreTitles.map(String) : [];
    const upcomingEventTitles = Array.isArray(snapshot.upcomingEventTitles) ? snapshot.upcomingEventTitles.map(String) : [];
    const lowStockTitles = Array.isArray(snapshot.lowStockTitles) ? snapshot.lowStockTitles.map(String) : [];
    const plannedMealTitles = Array.isArray(snapshot.plannedMealTitles) ? snapshot.plannedMealTitles.map(String) : [];
    const maintenanceTitles = Array.isArray(snapshot.maintenanceTitles) ? snapshot.maintenanceTitles.map(String) : [];
    const fairnessSummary = Array.isArray(snapshot.fairnessSummary) ? snapshot.fairnessSummary.map(String) : [];
    const spendingInsightSummaries = Array.isArray(snapshot.spendingInsightSummaries) ? snapshot.spendingInsightSummaries.map(String) : [];
    const dashboardHeadline = String(snapshot.dashboardHeadline ?? '');

    let response = {
      answer: `${householdName} is tracking chores, calendar, pantry, maintenance, meals, and spending in one place.`,
      facts: [dashboardHeadline].filter(Boolean),
      actions: [
        navigate('go-finances', 'Review finances', 'Check balances and spending insights.', '/(app)/finances'),
        navigate('go-chores', 'Review chores', 'Check the active queue and fairness.', '/(app)/chores'),
      ],
    };

    if (/(spend|expense|budget|money|cost)/.test(query)) {
      response = {
        answer: `${householdName} has spent $${(monthlySpendCents / 100).toFixed(2)} this month, with ${topSpendCategory} leading the category mix.`,
        facts: [`Top spending category: ${topSpendCategory}`, ...spendingInsightSummaries.slice(0, 2)],
        actions: [navigate('go-finances', 'Open finances', 'Review expenses, balances, and category history.', '/(app)/finances')],
      };
    } else if (/(chore|clean|task|fair)/.test(query)) {
      response = {
        answer: openChoreTitles.length > 0
          ? `${openChoreTitles.length} chores still need attention. ${openChoreTitles.slice(0, 2).join(' and ')} are the clearest next items.`
          : 'No chores are currently open.',
        facts: [...fairnessSummary.slice(0, 2), ...openChoreTitles.slice(0, 2).map((title) => `Open chore: ${title}`)],
        actions: [navigate('go-chores', 'Open chores', 'Review assignments and fairness details.', '/(app)/chores')],
      };
    } else if (/(meal|dinner|cook|recipe)/.test(query)) {
      response = {
        answer: plannedMealTitles.length > 0
          ? `${plannedMealTitles.length} meals are already planned. ${plannedMealTitles.slice(0, 2).join(' and ')} are next.`
          : 'No meals are planned yet on the weekly board.',
        facts: plannedMealTitles.slice(0, 3).map((title) => `Planned meal: ${title}`),
        actions: [navigate('go-meals', 'Open meals', 'Review the meal board and recipe suggestions.', '/(app)/meals')],
      };
    } else if (/(pantry|stock|grocery|shopping|suppl)/.test(query)) {
      const lowStock = lowStockTitles[0] ?? 'Restock item';
      response = {
        answer: lowStockTitles.length > 0
          ? `${lowStockTitles.length} stock alerts are open. ${lowStockTitles.slice(0, 2).join(' and ')} are the clearest restock candidates.`
          : 'No pantry or household stock alerts are currently open.',
        facts: lowStockTitles.slice(0, 3).map((title) => `Low stock: ${title}`),
        actions: [
          {
            id: `shop-${lowStock.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'create_shopping_item',
            label: `Add ${lowStock}`,
            description: 'Create a pending shopping item from this assistant suggestion.',
            route: '/(app)/shopping',
            shoppingItemDraft: {
              title: lowStock,
              quantity: 1,
              unit: null,
              category: normalizeCategory(lowStock),
            },
          },
          navigate('go-shopping', 'Open shopping', 'Review shared lists and aisle-grouped items.', '/(app)/shopping'),
        ],
      };
    } else if (/(repair|maint|fix)/.test(query)) {
      response = {
        answer: maintenanceTitles.length > 0
          ? `${maintenanceTitles.length} maintenance requests are active. ${maintenanceTitles.slice(0, 2).join(' and ')} are currently in motion.`
          : 'There are no active maintenance requests right now.',
        facts: maintenanceTitles.slice(0, 3).map((title) => `Active maintenance: ${title}`),
        actions: [navigate('go-maintenance', 'Open maintenance', 'Review repair status and appointments.', '/(app)/maintenance')],
      };
    } else if (/(calendar|schedule|coming up|event|booking)/.test(query)) {
      response = {
        answer: upcomingEventTitles.length > 0
          ? `${upcomingEventTitles.length} household events are coming up. ${upcomingEventTitles.slice(0, 2).join(' and ')} are next on the timeline.`
          : 'The household timeline is relatively quiet right now.',
        facts: upcomingEventTitles.slice(0, 3).map((title) => `Upcoming: ${title}`),
        actions: [navigate('go-calendar', 'Open calendar', 'Review the unified household timeline.', '/(app)/calendar')],
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Assistant function failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
