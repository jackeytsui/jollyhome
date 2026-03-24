import { buildFairnessStats } from '@/lib/fairness';
import type { HouseholdCalendarItem } from '@/types/calendar';
import type { ChoreFairnessStats } from '@/types/chores';
import type { Balance, Expense } from '@/types/expenses';
import type { InventoryAlert } from '@/types/inventory';
import type { MaintenanceRequest } from '@/types/maintenance';
import type { MealPlanEntry } from '@/types/meals';

export interface DashboardMember {
  userId: string;
  displayName: string;
}

interface DashboardExpense extends Pick<Expense, 'id' | 'amount_cents' | 'category' | 'description' | 'expense_date'> {}
interface DashboardCompletion {
  householdId: string;
  templateId: string;
  completedBy: string;
  completedAt: string;
  actualMinutes: number | null;
}

export interface HouseholdDashboardSummary {
  headline: string;
  subheadline: string;
  metrics: Array<{
    id: 'balances' | 'chores' | 'calendar' | 'supplies' | 'maintenance';
    label: string;
    value: string;
    supporting: string;
    route: '/(app)/finances' | '/(app)/chores' | '/(app)/calendar' | '/(app)/supplies' | '/(app)/maintenance';
    tone: 'neutral' | 'attention' | 'positive';
  }>;
}

export interface FairnessMemberSummary {
  memberId: string;
  memberName: string;
  completedMinutes: number;
  completedTaskCount: number;
  balanceCents: number;
  normalizedLaborDelta: number;
  normalizedMoneyDelta: number;
  combinedIndex: number;
  status: 'carrying' | 'supported' | 'mixed' | 'balanced';
  summary: string;
}

export interface FairnessOverview {
  headline: string;
  supporting: string;
  members: FairnessMemberSummary[];
}

export interface MonthlyReportSummary {
  monthLabel: string;
  spendTotalCents: number;
  topCategory: string;
  choresCompleted: number;
  choreMinutes: number;
  mealsPlanned: number;
  activeMaintenanceCount: number;
  lowStockCount: number;
  upcomingEventCount: number;
  highlights: string[];
}

export interface SpendingInsight {
  id: string;
  title: string;
  summary: string;
  evidence: string[];
  route: '/(app)/finances' | '/(app)/shopping' | '/(app)/meals';
  tone: 'attention' | 'neutral' | 'positive';
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function monthLabel(input: string) {
  const date = new Date(`${input}T00:00:00.000Z`);
  return date.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function monthKey(dateString: string) {
  return dateString.slice(0, 7);
}

function previousMonthKey(key: string) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildHouseholdDashboard(input: {
  householdName?: string | null;
  simplifiedDebts: Balance[];
  openChoreCount: number;
  upcomingCalendarCount: number;
  lowStockCount: number;
  activeMaintenanceCount: number;
  plannedMealCount: number;
}): HouseholdDashboardSummary {
  const attentionCount = [
    input.simplifiedDebts.length > 0,
    input.openChoreCount > 0,
    input.lowStockCount > 0,
    input.activeMaintenanceCount > 0,
  ].filter(Boolean).length;

  const householdLabel = input.householdName || 'Your household';

  return {
    headline: attentionCount > 0
      ? `${householdLabel} has ${attentionCount} active coordination areas`
      : `${householdLabel} is running smoothly today`,
    subheadline: input.plannedMealCount > 0
      ? `${input.plannedMealCount} meals are already planned while the rest of the household signals stay in view.`
      : 'The dashboard combines money, labor, calendar context, supplies, and maintenance in one pass.',
    metrics: [
      {
        id: 'balances',
        label: 'Balances',
        value: `${input.simplifiedDebts.length}`,
        supporting: input.simplifiedDebts.length > 0 ? 'settlements still open' : 'all settled',
        route: '/(app)/finances',
        tone: input.simplifiedDebts.length > 0 ? 'attention' : 'positive',
      },
      {
        id: 'chores',
        label: 'Open chores',
        value: `${input.openChoreCount}`,
        supporting: input.openChoreCount > 0 ? 'items still waiting' : 'queue is clear',
        route: '/(app)/chores',
        tone: input.openChoreCount > 0 ? 'attention' : 'positive',
      },
      {
        id: 'calendar',
        label: 'Upcoming',
        value: `${input.upcomingCalendarCount}`,
        supporting: 'household events ahead',
        route: '/(app)/calendar',
        tone: 'neutral',
      },
      {
        id: 'supplies',
        label: 'Low stock',
        value: `${input.lowStockCount}`,
        supporting: input.lowStockCount > 0 ? 'restocks flagged' : 'pantry stable',
        route: '/(app)/supplies',
        tone: input.lowStockCount > 0 ? 'attention' : 'positive',
      },
      {
        id: 'maintenance',
        label: 'Repairs',
        value: `${input.activeMaintenanceCount}`,
        supporting: input.activeMaintenanceCount > 0 ? 'requests in motion' : 'nothing active',
        route: '/(app)/maintenance',
        tone: input.activeMaintenanceCount > 0 ? 'neutral' : 'positive',
      },
    ],
  };
}

export function buildFairnessOverview(input: {
  householdId: string;
  members: DashboardMember[];
  completions: DashboardCompletion[];
  netBalances: Record<string, number>;
  now?: string;
}): FairnessOverview {
  const stats = buildFairnessStats({
    householdId: input.householdId,
    windowEnd: input.now ?? new Date().toISOString(),
    completions: input.completions,
  });

  const statsByMember = new Map(stats.map((item) => [item.memberId, item]));
  const members = input.members.map((member) => ({
    memberId: member.userId,
    memberName: member.displayName,
    stats: statsByMember.get(member.userId) ?? {
      householdId: input.householdId,
      memberId: member.userId,
      completedTaskCount: 0,
      completedMinutes: 0,
      rolling14DayTaskCount: 0,
      rolling14DayMinutes: 0,
      rolling30DayTaskCount: 0,
      rolling30DayMinutes: 0,
      fairnessDelta: 0,
      lastCompletedAt: null,
    } satisfies ChoreFairnessStats,
    balanceCents: input.netBalances[member.userId] ?? 0,
  }));

  const maxAbsLaborDelta = Math.max(1, ...members.map((member) => Math.abs(member.stats.fairnessDelta)));
  const maxAbsMoneyDelta = Math.max(1, ...members.map((member) => Math.abs(member.balanceCents)));

  const mapped = members.map<FairnessMemberSummary>((member) => {
    const normalizedLaborDelta = Math.round((member.stats.fairnessDelta / maxAbsLaborDelta) * 100);
    const normalizedMoneyDelta = Math.round((member.balanceCents / maxAbsMoneyDelta) * 100);
    const combinedIndex = Math.round((normalizedLaborDelta + normalizedMoneyDelta) / 2);

    let status: FairnessMemberSummary['status'] = 'balanced';
    if (Math.abs(combinedIndex) < 15) {
      status = 'balanced';
    } else if (normalizedLaborDelta >= 0 && normalizedMoneyDelta >= 0) {
      status = 'carrying';
    } else if (normalizedLaborDelta <= 0 && normalizedMoneyDelta <= 0) {
      status = 'supported';
    } else {
      status = 'mixed';
    }

    const balanceLabel = member.balanceCents >= 0
      ? `fronted ${formatCurrency(member.balanceCents)}`
      : `owes ${formatCurrency(Math.abs(member.balanceCents))}`;

    return {
      memberId: member.memberId,
      memberName: member.memberName,
      completedMinutes: member.stats.completedMinutes,
      completedTaskCount: member.stats.completedTaskCount,
      balanceCents: member.balanceCents,
      normalizedLaborDelta,
      normalizedMoneyDelta,
      combinedIndex,
      status,
      summary: `${member.stats.completedTaskCount} chores, ${member.stats.completedMinutes} min, ${balanceLabel}`,
    };
  }).sort((left, right) => right.combinedIndex - left.combinedIndex);

  const averageCombined = average(mapped.map((member) => member.combinedIndex));
  const carryingCount = mapped.filter((member) => member.status === 'carrying').length;
  const supportedCount = mapped.filter((member) => member.status === 'supported').length;

  return {
    headline: 'Shared fairness across labor and money',
    supporting: carryingCount > 0 || supportedCount > 0
      ? `${carryingCount} members are currently carrying extra load while ${supportedCount} are being supported.`
      : `Load is close to even with an average composite fairness score of ${Math.round(averageCombined)}.`,
    members: mapped,
  };
}

export function buildMonthlyReport(input: {
  now?: string;
  expenses: DashboardExpense[];
  completions: DashboardCompletion[];
  mealPlans: Pick<MealPlanEntry, 'plannedForDate' | 'status'>[];
  lowStockAlerts: InventoryAlert[];
  calendarItems: HouseholdCalendarItem[];
  maintenanceRequests: Pick<MaintenanceRequest, 'status'>[];
}): MonthlyReportSummary {
  const now = input.now ?? new Date().toISOString();
  const activeMonth = monthKey(now.slice(0, 10));

  const monthlyExpenses = input.expenses.filter((expense) => monthKey(expense.expense_date) === activeMonth);
  const monthlyCompletions = input.completions.filter((completion) => monthKey(completion.completedAt.slice(0, 10)) === activeMonth);
  const monthlyMeals = input.mealPlans.filter((meal) => monthKey(meal.plannedForDate) === activeMonth && meal.status === 'planned');
  const monthlyEvents = input.calendarItems.filter((item) => monthKey(item.startsAt.slice(0, 10)) === activeMonth);

  const spendTotalCents = monthlyExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0);
  const categoryTotals = new Map<string, number>();
  for (const expense of monthlyExpenses) {
    const key = expense.category || 'Uncategorized';
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + expense.amount_cents);
  }
  const topCategory = [...categoryTotals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Uncategorized';
  const choreMinutes = monthlyCompletions.reduce((sum, completion) => sum + (completion.actualMinutes ?? 0), 0);
  const activeMaintenanceCount = input.maintenanceRequests.filter((request) => request.status !== 'resolved').length;

  return {
    monthLabel: monthLabel(`${activeMonth}-01`),
    spendTotalCents,
    topCategory,
    choresCompleted: monthlyCompletions.length,
    choreMinutes,
    mealsPlanned: monthlyMeals.length,
    activeMaintenanceCount,
    lowStockCount: input.lowStockAlerts.filter((alert) => alert.status === 'open').length,
    upcomingEventCount: monthlyEvents.length,
    highlights: [
      `${formatCurrency(spendTotalCents)} spent this month`,
      `${monthlyCompletions.length} chores completed for ${choreMinutes} minutes`,
      `${monthlyMeals.length} meals planned and ${monthlyEvents.length} calendar items on record`,
    ],
  };
}

export function buildSpendingInsights(input: {
  now?: string;
  expenses: DashboardExpense[];
}): SpendingInsight[] {
  const now = input.now ?? new Date().toISOString();
  const currentMonth = monthKey(now.slice(0, 10));
  const previousMonth = previousMonthKey(currentMonth);

  const currentExpenses = input.expenses.filter((expense) => monthKey(expense.expense_date) === currentMonth);
  const previousExpenses = input.expenses.filter((expense) => monthKey(expense.expense_date) === previousMonth);

  const totalCurrent = currentExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0);
  const totalPrevious = previousExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0);
  const delta = totalCurrent - totalPrevious;

  const currentByCategory = new Map<string, number>();
  const previousByCategory = new Map<string, number>();
  for (const expense of currentExpenses) {
    const key = expense.category || 'Uncategorized';
    currentByCategory.set(key, (currentByCategory.get(key) ?? 0) + expense.amount_cents);
  }
  for (const expense of previousExpenses) {
    const key = expense.category || 'Uncategorized';
    previousByCategory.set(key, (previousByCategory.get(key) ?? 0) + expense.amount_cents);
  }

  const topCurrentCategory = [...currentByCategory.entries()].sort((left, right) => right[1] - left[1])[0] ?? ['Uncategorized', 0];
  const topCategoryPrevious = previousByCategory.get(topCurrentCategory[0]) ?? 0;

  const insights: SpendingInsight[] = [];

  insights.push({
    id: 'month-over-month',
    title: delta > 0 ? 'Monthly spend is trending up' : 'Monthly spend is holding or dropping',
    summary: delta > 0
      ? `${formatCurrency(totalCurrent)} spent this month, up ${formatCurrency(delta)} from last month.`
      : `${formatCurrency(totalCurrent)} spent this month, down ${formatCurrency(Math.abs(delta))} from last month.`,
    evidence: [
      `${monthLabel(`${currentMonth}-01`)} total: ${formatCurrency(totalCurrent)}`,
      `${monthLabel(`${previousMonth}-01`)} total: ${formatCurrency(totalPrevious)}`,
    ],
    route: '/(app)/finances',
    tone: delta > 0 ? 'attention' : 'positive',
  });

  insights.push({
    id: 'top-category',
    title: `${topCurrentCategory[0]} is the largest spend category`,
    summary: `${topCurrentCategory[0]} accounts for ${formatCurrency(topCurrentCategory[1])} this month.`,
    evidence: [
      `Current month: ${formatCurrency(topCurrentCategory[1])}`,
      `Previous month: ${formatCurrency(topCategoryPrevious)}`,
    ],
    route: topCurrentCategory[0].toLowerCase() === 'groceries' ? '/(app)/shopping' : '/(app)/finances',
    tone: topCurrentCategory[1] > topCategoryPrevious ? 'attention' : 'neutral',
  });

  const groceryExpenses = currentExpenses.filter((expense) => (expense.category || '').toLowerCase() === 'groceries');
  if (groceryExpenses.length > 0) {
    const averageReceipt = Math.round(
      groceryExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0) / groceryExpenses.length
    );
    insights.push({
      id: 'grocery-pattern',
      title: 'Grocery cadence is visible now',
      summary: `${groceryExpenses.length} grocery expenses average ${formatCurrency(averageReceipt)} each this month.`,
      evidence: [
        `Groceries this month: ${formatCurrency(groceryExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0))}`,
        `Average grocery receipt: ${formatCurrency(averageReceipt)}`,
      ],
      route: '/(app)/meals',
      tone: 'neutral',
    });
  }

  return insights;
}
