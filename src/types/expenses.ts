export type SplitType = 'equal' | 'percentage' | 'exact' | 'shares' | 'preset';

export interface Expense {
  id: string;
  household_id: string;
  created_by: string;
  description: string;
  amount_cents: number;
  currency: string;
  category: string | null;
  paid_by: string;
  split_type: SplitType;
  split_preset_id: string | null;
  tax_cents: number;
  tip_cents: number;
  is_private: boolean;
  receipt_url: string | null;
  recurring_template_id: string | null;
  expense_date: string;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount_cents: number;
  is_personal: boolean;
  created_at: string;
}

export interface LedgerEntry {
  paidBy: string;
  splits: { userId: string; amount: number }[];
}

export interface Balance {
  from: string;
  to: string;
  amount: number;
}

export interface Settlement {
  id: string;
  household_id: string;
  from_user_id: string;
  to_user_id: string;
  amount_cents: number;
  payment_method: string | null;
  note: string | null;
  created_at: string;
}

export interface SplitPreset {
  id: string;
  household_id: string;
  name: string;
  shares: { user_id: string; percentage: number }[];
  created_by: string;
  created_at: string;
}

export interface ExpenseVersion {
  id: string;
  expense_id: string;
  changed_by: string;
  change_type: 'created' | 'edited' | 'deleted';
  previous_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  created_at: string;
}

export interface ExpenseDispute {
  id: string;
  expense_id: string;
  opened_by: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface DisputeComment {
  id: string;
  dispute_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface RecurringExpenseTemplate {
  id: string;
  household_id: string;
  created_by: string;
  description: string;
  amount_cents: number;
  category: string | null;
  split_type: SplitType;
  split_preset_id: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  day_of_month: number | null;
  day_of_week: number | null;
  custom_interval_days: number | null;
  next_due_date: string;
  is_paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentPreferences {
  id: string;
  user_id: string;
  preferred_app: 'venmo' | 'cashapp' | 'paypal' | 'zelle' | null;
  venmo_username: string | null;
  cashapp_username: string | null;
  paypal_email: string | null;
  zelle_identifier: string | null;
}

export interface ExpenseFilters {
  dateFrom: string | null;
  dateTo: string | null;
  category: string | null;
  memberId: string | null;
  amountMin: number | null;
  amountMax: number | null;
  search: string | null;
}

export interface CreateExpenseInput {
  household_id: string;
  description: string;
  amount_cents: number;
  category: string | null;
  paid_by: string;
  split_type: SplitType;
  splits: { user_id: string; amount_cents: number }[];
  tax_cents?: number;
  tip_cents?: number;
  is_private?: boolean;
  receipt_url?: string | null;
  expense_date?: string;
}
