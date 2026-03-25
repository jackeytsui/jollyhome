import type { HouseholdCalendarItem } from '@/types/calendar';
import type { NotificationFeatureRoute } from '@/types/notifications';

export interface UnifiedTimelineEntry {
  id: string;
  title: string;
  sourceType: HouseholdCalendarItem['sourceType'];
  startsAt: string;
  supporting: string;
}

export interface UnifiedTimelineSummary {
  headline: string;
  supporting: string;
  entries: UnifiedTimelineEntry[];
}

export interface ContextSuggestion {
  id: string;
  title: string;
  summary: string;
  route: NotificationFeatureRoute;
}

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  route: NotificationFeatureRoute | null;
}

function formatSourceLabel(sourceType: HouseholdCalendarItem['sourceType']) {
  if (sourceType === 'quiet-hours') {
    return 'Quiet hours';
  }

  return sourceType[0].toUpperCase() + sourceType.slice(1);
}

function formatTimelineTime(item: HouseholdCalendarItem) {
  if (item.allDay) {
    return 'All day';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(item.startsAt));
}

export function buildUnifiedTimelineSummary(input: {
  items: HouseholdCalendarItem[];
  now?: string;
  limit?: number;
}): UnifiedTimelineSummary {
  const nowTime = new Date(input.now ?? new Date().toISOString()).getTime();
  const entries = [...input.items]
    .filter((item) => new Date(item.endsAt).getTime() >= nowTime)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, input.limit ?? 5)
    .map<UnifiedTimelineEntry>((item) => ({
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      startsAt: item.startsAt,
      supporting: `${formatSourceLabel(item.sourceType)} • ${formatTimelineTime(item)}`,
    }));

  return {
    headline: entries.length > 0
      ? `Next ${entries.length} timeline items across the household`
      : 'No upcoming items on the household timeline',
    supporting: entries.length > 0
      ? 'Events, chores, meals, maintenance, bookings, and quiet hours all share one timeline.'
      : 'As activity appears, it will land here in one unified household view.',
    entries,
  };
}

export function buildContextSuggestions(input: {
  lowStockTitles: string[];
  plannedMealTitles: string[];
  openChoreTitles: string[];
  upcomingEventTitles: string[];
  maintenanceTitles: string[];
  spendingInsightSummaries: string[];
  fairnessSummary: string[];
}): ContextSuggestion[] {
  const suggestions: ContextSuggestion[] = [];

  if (input.lowStockTitles.length > 0 && input.plannedMealTitles.length > 0) {
    suggestions.push({
      id: 'restock-before-meals',
      title: 'Restock before the next meals',
      summary: `${input.lowStockTitles[0]} is low while ${input.plannedMealTitles[0]} is already on the board.`,
      route: '/(app)/shopping',
    });
  }

  if (input.openChoreTitles.length > 0 && input.upcomingEventTitles.length > 0) {
    suggestions.push({
      id: 'prep-before-event',
      title: 'Prep the house before upcoming plans',
      summary: `${input.openChoreTitles[0]} is still open and ${input.upcomingEventTitles[0]} is coming up next.`,
      route: '/(app)/chores',
    });
  }

  if (input.maintenanceTitles.length > 0) {
    suggestions.push({
      id: 'follow-up-maintenance',
      title: 'Check the active repair flow',
      summary: `${input.maintenanceTitles[0]} is active and should stay visible on the household timeline.`,
      route: '/(app)/maintenance',
    });
  }

  if (input.spendingInsightSummaries.length > 0) {
    suggestions.push({
      id: 'review-spending',
      title: 'Review the current spending signal',
      summary: input.spendingInsightSummaries[0],
      route: '/(app)/finances',
    });
  }

  if (input.fairnessSummary.length > 0) {
    suggestions.push({
      id: 'rebalance-load',
      title: 'Check the current fairness picture',
      summary: input.fairnessSummary[0],
      route: '/(app)/chores',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'review-timeline',
      title: 'Start from the shared timeline',
      summary: 'Use the calendar as the connected view across chores, meals, guests, and maintenance.',
      route: '/(app)/calendar',
    });
  }

  return suggestions.slice(0, 4);
}

export function buildOnboardingSteps(input: {
  householdName: string | null;
  memberCount: number;
  timelineCount: number;
  plannedMealCount: number;
  lowStockCount: number;
  activeMaintenanceCount: number;
  hasExpenses: boolean;
  hasChores: boolean;
}): OnboardingStep[] {
  const label = input.householdName ?? 'your household';

  return [
    {
      id: 'overview',
      title: `Welcome to ${label}`,
      body: 'HomeOS works best when the household picture comes first: timeline, dashboard, balances, pantry, meals, and maintenance all connect here.',
      route: null,
    },
    {
      id: 'timeline',
      title: 'Use the timeline as the shared source of truth',
      body: input.timelineCount > 0
        ? `${input.timelineCount} household items are already flowing through the unified calendar.`
        : 'Events, chores, meals, guest notices, maintenance visits, and bookings all land on the same timeline.',
      route: '/(app)/calendar',
    },
    {
      id: 'systems',
      title: 'Treat chores, pantry, meals, and money as one system',
      body: [
        input.hasChores ? 'Chores are already active.' : 'Chores can be assigned and tracked here.',
        input.hasExpenses ? 'Expenses already feed the dashboard.' : 'Expenses and balances will feed the dashboard once added.',
        input.plannedMealCount > 0 ? `${input.plannedMealCount} meals are planned.` : 'Meal planning can drive smarter restocks.',
        input.lowStockCount > 0 ? `${input.lowStockCount} stock alerts are open.` : 'Low-stock alerts will surface automatically.',
        input.activeMaintenanceCount > 0 ? `${input.activeMaintenanceCount} maintenance requests are active.` : 'Maintenance stays visible through the same system.',
      ].join(' '),
      route: '/(app)/meals',
    },
  ];
}
