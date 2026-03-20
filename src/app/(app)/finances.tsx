import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function FinancesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  function handleAddExpense() {
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parsedAmount,
      date: new Date().toLocaleDateString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setDescription('');
    setAmount('');
  }

  function renderExpense({ item }: { item: Expense }) {
    return (
      <View style={styles.expenseItem}>
        <View style={styles.expenseLeft}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>{item.date}</Text>
        </View>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, styles.bgDominant]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>My Expenses</Text>

        {/* Add Expense Section */}
        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>Add Expense</Text>
          <TextInput
            style={styles.input}
            placeholder="Description"
            placeholderTextColor={colors.textSecondary.light}
            value={description}
            onChangeText={setDescription}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            placeholderTextColor={colors.textSecondary.light}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <View style={styles.buttonWrapper}>
            <Button
              label="Add Expense"
              variant="primary"
              onPress={handleAddExpense}
            />
          </View>
        </Card>

        {/* Expense List */}
        {expenses.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No expenses yet. Add your first personal expense above.
            </Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id}
              renderItem={renderExpense}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Card>
        )}

        <Text style={styles.phaseNote}>
          Phase 1 — personal tracking with local state. Shared expense tracking with Supabase comes in Phase 2.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bgDominant: {
    backgroundColor: colors.dominant.light,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 30,
    marginBottom: 4,
  },
  addCard: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary.light,
    backgroundColor: colors.dominant.light,
  },
  buttonWrapper: {
    marginTop: 4,
  },
  listCard: {
    gap: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  expenseLeft: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  expenseDate: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 22,
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 6,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary.light,
    lineHeight: 22,
    textAlign: 'center',
  },
  phaseNote: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
