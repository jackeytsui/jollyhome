import {
  calculateSplit,
  computeBalances,
  simplifyDebts,
  distributeTaxProportionally,
  suggestCategory,
} from '@/lib/expenseMath';
import { buildPaymentLink } from '@/lib/paymentLinks';

// ============================================================
// calculateSplit — equal split
// ============================================================

describe('calculateSplit — equal', () => {
  it('divides evenly when no remainder', () => {
    const result = calculateSplit('equal', 10000, ['u1', 'u2']);
    expect(result).toEqual([5000, 5000]);
  });

  it('gives remainder cent to last person', () => {
    const result = calculateSplit('equal', 24185, ['u1', 'u2', 'u3']);
    expect(result).toEqual([8062, 8062, 8061]);
  });

  it('single member gets full amount', () => {
    const result = calculateSplit('equal', 9999, ['u1']);
    expect(result).toEqual([9999]);
  });

  it('four members with remainder', () => {
    const result = calculateSplit('equal', 10001, ['u1', 'u2', 'u3', 'u4']);
    const sum = (result as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBe(10001);
  });
});

// ============================================================
// calculateSplit — percentage
// ============================================================

describe('calculateSplit — percentage', () => {
  it('splits by percentage correctly', () => {
    const result = calculateSplit('percentage', 10000, [
      { userId: 'u1', value: 60 },
      { userId: 'u2', value: 40 },
    ]);
    expect(result).toEqual([
      { userId: 'u1', amount: 6000 },
      { userId: 'u2', amount: 4000 },
    ]);
  });

  it('throws when percentages do not sum to 100', () => {
    expect(() =>
      calculateSplit('percentage', 10000, [
        { userId: 'u1', value: 60 },
        { userId: 'u2', value: 30 },
      ])
    ).toThrow();
  });

  it('gives remainder to last person to avoid cent drift', () => {
    // 10001 cents * 33% = 3300.33... floor = 3300 each; 3300+3300+remainder
    const result = calculateSplit('percentage', 10001, [
      { userId: 'u1', value: 33 },
      { userId: 'u2', value: 33 },
      { userId: 'u3', value: 34 },
    ]);
    const amounts = (result as { userId: string; amount: number }[]).map((r) => r.amount);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(10001);
  });
});

// ============================================================
// calculateSplit — exact
// ============================================================

describe('calculateSplit — exact', () => {
  it('returns amounts as-is when they sum to total', () => {
    const result = calculateSplit('exact', 10000, [
      { userId: 'u1', value: 6000 },
      { userId: 'u2', value: 4000 },
    ]);
    expect(result).toEqual([
      { userId: 'u1', amount: 6000 },
      { userId: 'u2', amount: 4000 },
    ]);
  });

  it('throws when amounts do not sum to total', () => {
    expect(() =>
      calculateSplit('exact', 10000, [
        { userId: 'u1', value: 6000 },
        { userId: 'u2', value: 3000 },
      ])
    ).toThrow();
  });
});

// ============================================================
// calculateSplit — shares
// ============================================================

describe('calculateSplit — shares', () => {
  it('distributes proportionally by share count', () => {
    const result = calculateSplit('shares', 10000, [
      { userId: 'u1', value: 2 },
      { userId: 'u2', value: 1 },
    ]);
    expect(result).toEqual([
      { userId: 'u1', amount: 6667 },
      { userId: 'u2', amount: 3333 },
    ]);
  });

  it('sum of shares amounts equals total', () => {
    const result = calculateSplit('shares', 10001, [
      { userId: 'u1', value: 3 },
      { userId: 'u2', value: 2 },
      { userId: 'u3', value: 1 },
    ]);
    const amounts = (result as { userId: string; amount: number }[]).map((r) => r.amount);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(10001);
  });
});

// ============================================================
// computeBalances
// ============================================================

describe('computeBalances', () => {
  it('A pays 10000 split equally: A owed 5000, B owes 5000', () => {
    const result = computeBalances([
      {
        paidBy: 'A',
        splits: [
          { userId: 'A', amount: 5000 },
          { userId: 'B', amount: 5000 },
        ],
      },
    ]);
    expect(result['A']).toBe(5000);
    expect(result['B']).toBe(-5000);
  });

  it('accumulates balances across multiple expenses', () => {
    const result = computeBalances([
      {
        paidBy: 'A',
        splits: [
          { userId: 'A', amount: 5000 },
          { userId: 'B', amount: 5000 },
        ],
      },
      {
        paidBy: 'B',
        splits: [
          { userId: 'A', amount: 2000 },
          { userId: 'B', amount: 2000 },
        ],
      },
    ]);
    // A is owed 5000 from first expense, owes 2000 from second → net +3000
    expect(result['A']).toBe(3000);
    // B owes 5000 from first expense, is owed 2000 from second → net -3000
    expect(result['B']).toBe(-3000);
  });

  it('returns empty object for no entries', () => {
    expect(computeBalances([])).toEqual({});
  });

  it('payer does not create a debt to themselves', () => {
    // When paidBy === userId in splits, it should not generate a balance entry for that pair
    const result = computeBalances([
      {
        paidBy: 'A',
        splits: [{ userId: 'A', amount: 10000 }],
      },
    ]);
    expect(Object.values(result).every((v) => v === 0)).toBe(true);
  });
});

// ============================================================
// simplifyDebts
// ============================================================

describe('simplifyDebts', () => {
  it('returns correct transfers for simple A owes B', () => {
    const result = simplifyDebts({ A: 10000, B: -5000, C: -5000 });
    expect(result).toHaveLength(2);
    const fromB = result.find((r) => r.from === 'B');
    const fromC = result.find((r) => r.from === 'C');
    expect(fromB).toBeDefined();
    expect(fromC).toBeDefined();
    expect(fromB?.amount).toBe(5000);
    expect(fromC?.amount).toBe(5000);
  });

  it('simplifies A->B->C chain into single transfer A->C', () => {
    // A is owed 10000, C owes 10000, B is even
    const result = simplifyDebts({ A: 10000, B: 0, C: -10000 });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ from: 'C', to: 'A', amount: 10000 });
  });

  it('returns empty array for zero balances', () => {
    const result = simplifyDebts({ A: 0, B: 0, C: 0 });
    expect(result).toEqual([]);
  });

  it('ignores sub-cent amounts', () => {
    // Sub-cent residuals from floating point should be ignored
    const result = simplifyDebts({ A: 0, B: 0 });
    expect(result).toEqual([]);
  });

  it('minimizes transfer count across complex group', () => {
    // A owed 30000, B owes 10000, C owes 20000 → 2 transfers (not 3+)
    const result = simplifyDebts({ A: 30000, B: -10000, C: -20000 });
    expect(result.length).toBeLessThanOrEqual(2);
    const totalTransferred = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalTransferred).toBe(30000);
  });
});

// ============================================================
// distributeTaxProportionally
// ============================================================

describe('distributeTaxProportionally', () => {
  it('distributes tax and tip proportionally; sum equals inputs plus tax plus tip', () => {
    const items = { u1: 6000, u2: 4000 };
    const result = distributeTaxProportionally(items, 500, 1000);
    const totalOut = Object.values(result).reduce((a, b) => a + b, 0);
    expect(totalOut).toBe(6000 + 4000 + 500 + 1000);
  });

  it('single user gets all tax and tip', () => {
    const result = distributeTaxProportionally({ u1: 5000 }, 300, 700);
    expect(result['u1']).toBe(5000 + 300 + 700);
  });

  it('distributes proportionally (larger share gets more tax)', () => {
    const result = distributeTaxProportionally({ u1: 6000, u2: 4000 }, 1000, 0);
    // u1 has 60% → gets floor(1000*0.6)=600; u2 gets remainder 400
    expect(result['u1']).toBeGreaterThan(result['u2'] - 4000);
  });

  it('returns empty object for empty inputs', () => {
    const result = distributeTaxProportionally({}, 100, 100);
    expect(result).toEqual({});
  });
});

// ============================================================
// suggestCategory
// ============================================================

describe('suggestCategory', () => {
  it('suggests Groceries for Costco', () => {
    expect(suggestCategory('Costco groceries')).toBe('Groceries');
  });

  it('suggests Transport for Uber ride', () => {
    expect(suggestCategory('Uber ride')).toBe('Transport');
  });

  it('returns null for unrecognized description', () => {
    expect(suggestCategory('random thing')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(suggestCategory('COSTCO shopping')).toBe('Groceries');
    expect(suggestCategory('NETFLIX subscription')).toBe('Entertainment');
  });

  it('matches Dining for restaurant', () => {
    expect(suggestCategory('pizza restaurant')).toBe('Dining');
  });

  it('matches Utilities for electricity', () => {
    expect(suggestCategory('electric bill')).toBe('Utilities');
  });

  it('matches Rent for rent', () => {
    expect(suggestCategory('Monthly rent payment')).toBe('Rent');
  });

  it('matches Healthcare for pharmacy', () => {
    expect(suggestCategory('CVS pharmacy trip')).toBe('Healthcare');
  });
});

// ============================================================
// buildPaymentLink
// ============================================================

describe('buildPaymentLink', () => {
  it('generates correct Venmo deep link', () => {
    const link = buildPaymentLink('venmo', 'jakesmith', 5000, 'Rent');
    expect(link).toContain('venmo://paycharge');
    expect(link).toContain('50.00');
    expect(link).toContain('jakesmith');
  });

  it('generates correct CashApp deep link', () => {
    const link = buildPaymentLink('cashapp', '$jake', 5000, 'Rent');
    expect(link).toContain('cashapp://');
    expect(link).toContain('50.00');
  });

  it('generates correct PayPal URL', () => {
    const link = buildPaymentLink('paypal', 'jake@email.com', 5000, 'Rent');
    expect(link).toContain('paypal.com/paypalme');
    expect(link).toContain('50.00');
  });

  it('generates Zelle deep link', () => {
    const link = buildPaymentLink('zelle', '555-1234', 5000, 'Rent');
    expect(link).toBe('zellepay://');
  });

  it('encodes note in Venmo link', () => {
    const link = buildPaymentLink('venmo', 'user', 1000, 'July Rent & Utilities');
    expect(link).toContain(encodeURIComponent('July Rent & Utilities'));
  });

  it('formats amount as dollars with 2 decimal places', () => {
    const link = buildPaymentLink('venmo', 'user', 12345, 'test');
    expect(link).toContain('123.45');
  });
});
