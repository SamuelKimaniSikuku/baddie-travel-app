// ═══════════════════════════════════════════════════════════════
// EXPENSES SERVICE — Expense tracking and cost splitting
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

class ExpensesService {
  // Add an expense
  async addExpense(tripId, { description, amount, currency = 'USD', paidBy, splitType = 'equal', memberIds }) {
    if (isDemo) {
      return { data: { id: Date.now().toString(), description, amount, paid_by: paidBy, split_type: splitType }, error: null };
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        description,
        amount,
        currency,
        paid_by: paidBy,
        split_type: splitType,
      })
      .select()
      .single();

    if (error) return { data: null, error };

    // Create splits
    if (splitType === 'equal' && memberIds?.length > 0) {
      const splitAmount = amount / memberIds.length;
      const splits = memberIds.map(uid => ({
        expense_id: expense.id,
        user_id: uid,
        amount: splitAmount,
        settled: uid === paidBy, // Payer's share is auto-settled
      }));

      await supabase.from('expense_splits').insert(splits);
    }

    return { data: expense, error: null };
  }

  // Get all expenses for a trip
  async getExpenses(tripId) {
    if (isDemo) return { data: [], error: null };

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:profiles!expenses_paid_by_fkey(id, name, avatar),
        expense_splits(
          *,
          user:profiles!expense_splits_user_id_fkey(id, name, avatar)
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Calculate balances between trip members
  async calculateBalances(tripId) {
    if (isDemo) return { balances: [], total: 0, error: null };

    const { data: expenses, error } = await this.getExpenses(tripId);
    if (error) return { balances: [], total: 0, error };

    const balances = {};

    expenses?.forEach(expense => {
      expense.expense_splits?.forEach(split => {
        if (!balances[split.user_id]) {
          balances[split.user_id] = { user: split.user, paid: 0, owes: 0 };
        }
        balances[split.user_id].owes += split.amount;
      });

      if (!balances[expense.paid_by]) {
        balances[expense.paid_by] = { user: expense.paid_by_user, paid: 0, owes: 0 };
      }
      balances[expense.paid_by].paid += expense.amount;
    });

    const total = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    return {
      balances: Object.entries(balances).map(([userId, data]) => ({
        userId,
        ...data,
        net: data.paid - data.owes,
      })),
      total,
      error: null,
    };
  }

  // Settle an expense split
  async settleExpense(splitId) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('expense_splits')
      .update({ settled: true })
      .eq('id', splitId);
    return { error };
  }

  // Delete an expense
  async deleteExpense(expenseId) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    return { error };
  }
}

export const expensesService = new ExpensesService();
export default expensesService;
