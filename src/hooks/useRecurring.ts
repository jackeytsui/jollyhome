import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { RecurringExpenseTemplate, SplitType } from '@/types/expenses';

export interface CreateTemplateInput {
  description: string;
  amount_cents: number;
  category: string | null;
  split_type: SplitType;
  split_config: Record<string, unknown>;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  day_of_month?: number | null;
  day_of_week?: number | null;
  custom_interval_days?: number | null;
  next_due_date: string;
}

function advanceDueDate(template: RecurringExpenseTemplate): string {
  const current = new Date(template.next_due_date);

  switch (template.frequency) {
    case 'daily':
      current.setDate(current.getDate() + 1);
      break;
    case 'weekly':
      current.setDate(current.getDate() + 7);
      break;
    case 'biweekly':
      current.setDate(current.getDate() + 14);
      break;
    case 'monthly': {
      const targetDay = template.day_of_month ?? current.getDate();
      // Advance to next month, same day_of_month (clamp to month end)
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const maxDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      nextMonth.setDate(Math.min(targetDay, maxDay));
      return nextMonth.toISOString().split('T')[0];
    }
    case 'custom':
      current.setDate(current.getDate() + (template.custom_interval_days ?? 1));
      break;
  }

  return current.toISOString().split('T')[0];
}

export function useRecurring() {
  const [templates, setTemplates] = useState<RecurringExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const { activeHouseholdId } = useHouseholdStore();

  const loadTemplates = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_expense_templates')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setTemplates((data as RecurringExpenseTemplate[]) ?? []);
    } catch (err) {
      console.warn('loadTemplates error:', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const createTemplate = useCallback(async (input: CreateTemplateInput): Promise<boolean> => {
    if (!activeHouseholdId || !user) return false;

    try {
      const { error } = await supabase
        .from('recurring_expense_templates')
        .insert({
          household_id: activeHouseholdId,
          created_by: user.id,
          description: input.description,
          amount_cents: input.amount_cents,
          category: input.category,
          split_type: input.split_type,
          split_config: input.split_config,
          frequency: input.frequency,
          day_of_month: input.day_of_month ?? null,
          day_of_week: input.day_of_week ?? null,
          custom_interval_days: input.custom_interval_days ?? null,
          next_due_date: input.next_due_date,
          is_paused: false,
        });

      if (error) throw error;

      await loadTemplates();
      return true;
    } catch (err) {
      console.warn('createTemplate error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, [activeHouseholdId, user, loadTemplates]);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<Omit<RecurringExpenseTemplate, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_expense_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadTemplates();
      return true;
    } catch (err) {
      console.warn('updateTemplate error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, [loadTemplates]);

  const pauseTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_expense_templates')
        .update({ is_paused: true })
        .eq('id', id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_paused: true } : t))
      );
      return true;
    } catch (err) {
      console.warn('pauseTemplate error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, []);

  const resumeTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_expense_templates')
        .update({ is_paused: false })
        .eq('id', id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_paused: false } : t))
      );
      return true;
    } catch (err) {
      console.warn('resumeTemplate error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, []);

  const skipNext = useCallback(async (id: string): Promise<boolean> => {
    const template = templates.find((t) => t.id === id);
    if (!template) return false;

    const newDueDate = advanceDueDate(template);

    try {
      const { error } = await supabase
        .from('recurring_expense_templates')
        .update({ next_due_date: newDueDate })
        .eq('id', id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, next_due_date: newDueDate } : t))
      );
      return true;
    } catch (err) {
      console.warn('skipNext error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, [templates]);

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_expense_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      console.warn('deleteTemplate error:', err instanceof Error ? err.message : err);
      return false;
    }
  }, []);

  const processOverdue = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('recurring_expense_templates')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .eq('is_paused', false)
        .lte('next_due_date', today);

      if (error) throw error;

      const overdueTemplates = (data as RecurringExpenseTemplate[]) ?? [];

      for (const template of overdueTemplates) {
        await supabase.rpc('create_recurring_expense_instance', {
          p_template_id: template.id,
        });
      }

      if (overdueTemplates.length > 0) {
        await loadTemplates();
      }
    } catch (err) {
      // Non-fatal: recurring processing errors should not block the app
      console.warn('processOverdue error:', err instanceof Error ? err.message : err);
    }
  }, [activeHouseholdId, loadTemplates]);

  // Auto-process overdue templates on mount when household is ready
  useEffect(() => {
    if (activeHouseholdId) {
      processOverdue().then(() => loadTemplates());
    }
  }, [activeHouseholdId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    pauseTemplate,
    resumeTemplate,
    skipNext,
    deleteTemplate,
    processOverdue,
    loadTemplates,
  };
}
