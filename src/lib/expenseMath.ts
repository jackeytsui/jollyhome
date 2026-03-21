import type { LedgerEntry, Balance, SplitType } from '@/types/expenses';

// ============================================================
// Category keyword map for client-side category suggestion
// ============================================================

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Groceries': ['costco', 'trader joe', 'whole foods', 'safeway', 'kroger', 'walmart', 'grocery', 'supermarket'],
  'Dining': ['restaurant', 'pizza', 'sushi', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'uber eats', 'doordash'],
  'Utilities': ['electric', 'gas', 'water', 'internet', 'wifi', 'pg&e', 'spectrum', 'comcast', 'utility'],
  'Rent': ['rent', 'lease', 'landlord'],
  'Transport': ['uber', 'lyft', 'gas station', 'parking', 'transit', 'bart', 'metro'],
  'Entertainment': ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'concert', 'ticket'],
  'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'dentist', 'prescription'],
  'Household': ['amazon', 'target', 'home depot', 'ikea', 'supplies', 'cleaning'],
};

// ============================================================
// Types for split calculation input
// ============================================================

type EqualSplitInput = string[];

interface WeightedSplitItem {
  userId: string;
  value: number;
}

type WeightedSplitInput = WeightedSplitItem[];

// ============================================================
// calculateSplit
// All amounts are integer cents — no floats in calculation logic.
// ============================================================

export function calculateSplit(
  type: 'equal',
  totalCents: number,
  members: EqualSplitInput
): number[];

export function calculateSplit(
  type: 'percentage' | 'exact' | 'shares',
  totalCents: number,
  members: WeightedSplitInput
): { userId: string; amount: number }[];

export function calculateSplit(
  type: SplitType,
  totalCents: number,
  members: EqualSplitInput | WeightedSplitInput
): number[] | { userId: string; amount: number }[] {
  switch (type) {
    case 'equal': {
      const userIds = members as EqualSplitInput;
      const count = userIds.length;
      if (count === 0) return [];
      const base = Math.floor(totalCents / count);
      const remainder = totalCents - base * count;
      // First (count - remainder) members get `base`, last `remainder` members get `base + 1`
      // But per spec: last person gets the remainder, so they get (base - (count - 1 - i) ... )
      // Simpler: first (count-1) members get `base`, last member gets `base + remainder`
      // Actually: last person gets less (remainder goes to last per spec: "last person gets remainder")
      // Re-reading spec: "last person gets remainder" means last gets base + remainder if remainder > 0
      // But test: calculateSplit('equal', 24185, ['u1','u2','u3']) returns [8062, 8062, 8061]
      // 24185 / 3 = 8061.67, floor = 8061, remainder = 24185 - 8061*3 = 24185 - 24183 = 2
      // So first 2 get 8062, last gets 8061 → first (remainder) members get base+1, rest get base
      const result: number[] = [];
      for (let i = 0; i < count; i++) {
        if (i < remainder) {
          result.push(base + 1);
        } else {
          result.push(base);
        }
      }
      return result;
    }

    case 'percentage': {
      const items = members as WeightedSplitInput;
      const total = items.reduce((sum, item) => sum + item.value, 0);
      if (Math.round(total) !== 100) {
        throw new Error(`Percentages must sum to 100, got ${total}`);
      }
      const result: { userId: string; amount: number }[] = [];
      let distributed = 0;
      for (let i = 0; i < items.length; i++) {
        if (i === items.length - 1) {
          result.push({ userId: items[i].userId, amount: totalCents - distributed });
        } else {
          const amount = Math.floor(totalCents * (items[i].value / 100));
          result.push({ userId: items[i].userId, amount });
          distributed += amount;
        }
      }
      return result;
    }

    case 'exact': {
      const items = members as WeightedSplitInput;
      const total = items.reduce((sum, item) => sum + item.value, 0);
      if (total !== totalCents) {
        throw new Error(`Exact amounts must sum to ${totalCents}, got ${total}`);
      }
      return items.map((item) => ({ userId: item.userId, amount: item.value }));
    }

    case 'shares': {
      const items = members as WeightedSplitInput;
      const totalShares = items.reduce((sum, item) => sum + item.value, 0);
      if (totalShares === 0) throw new Error('Total shares cannot be zero');
      // Floor all amounts, then distribute remainder cents to the first people
      const floored = items.map((item) => Math.floor(totalCents * (item.value / totalShares)));
      const sumFloored = floored.reduce((a, b) => a + b, 0);
      const remainder = totalCents - sumFloored;
      return items.map((item, i) => ({
        userId: item.userId,
        amount: floored[i] + (i < remainder ? 1 : 0),
      }));
    }

    case 'preset':
      throw new Error('preset split type requires a split_preset_id — use calculateSplit with percentage or shares');

    default:
      throw new Error(`Unknown split type: ${type}`);
  }
}

// ============================================================
// computeBalances
// Positive = owed money; negative = owes money.
// ============================================================

export function computeBalances(entries: LedgerEntry[]): Record<string, number> {
  const net: Record<string, number> = {};
  for (const entry of entries) {
    for (const split of entry.splits) {
      if (split.userId !== entry.paidBy) {
        net[split.userId] = (net[split.userId] ?? 0) - split.amount;
        net[entry.paidBy] = (net[entry.paidBy] ?? 0) + split.amount;
      }
    }
  }
  return net;
}

// ============================================================
// simplifyDebts
// Greedy algorithm: match largest creditor with largest debtor.
// Ignores balances where |amount| < 1 cent.
// ============================================================

export function simplifyDebts(net: Record<string, number>): Balance[] {
  const creditors = Object.entries(net)
    .filter(([, v]) => v >= 1)
    .map(([id, amt]) => ({ id, amt }))
    .sort((a, b) => b.amt - a.amt);

  const debtors = Object.entries(net)
    .filter(([, v]) => v <= -1)
    .map(([id, amt]) => ({ id, amt: -amt }))
    .sort((a, b) => b.amt - a.amt);

  const result: Balance[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const settle = Math.min(creditors[ci].amt, debtors[di].amt);
    if (settle >= 1) {
      result.push({ from: debtors[di].id, to: creditors[ci].id, amount: settle });
    }
    creditors[ci].amt -= settle;
    debtors[di].amt -= settle;
    if (creditors[ci].amt < 1) ci++;
    if (debtors[di].amt < 1) di++;
  }

  return result;
}

// ============================================================
// distributeTaxProportionally
// Distributes tax and tip proportionally by item totals.
// Last person receives remainder to ensure exact total.
// ============================================================

export function distributeTaxProportionally(
  itemTotalsByCents: Record<string, number>,
  taxCents: number,
  tipCents: number
): Record<string, number> {
  const grandItemTotal = Object.values(itemTotalsByCents).reduce((a, b) => a + b, 0);
  if (grandItemTotal === 0) return {};

  const result: Record<string, number> = {};
  let distributedTax = 0;
  let distributedTip = 0;
  const userIds = Object.keys(itemTotalsByCents);

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const ratio = itemTotalsByCents[userId] / grandItemTotal;

    if (i === userIds.length - 1) {
      result[userId] =
        itemTotalsByCents[userId] +
        (taxCents - distributedTax) +
        (tipCents - distributedTip);
    } else {
      const userTax = Math.floor(taxCents * ratio);
      const userTip = Math.floor(tipCents * ratio);
      result[userId] = itemTotalsByCents[userId] + userTax + userTip;
      distributedTax += userTax;
      distributedTip += userTip;
    }
  }

  return result;
}

// ============================================================
// suggestCategory
// Case-insensitive keyword matching against CATEGORY_KEYWORDS.
// Returns first match or null.
// ============================================================

export function suggestCategory(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return null;
}
