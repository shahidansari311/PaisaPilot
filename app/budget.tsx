import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ArrowLeft, Check, Edit3, Target, TrendingDown, TrendingUp, Trash2 } from 'lucide-react-native';

interface MonthBudget {
  id: string;
  amount: number;
  month: string;
}

interface MonthStats {
  totalExpense: number;
  totalIncome: number;
}

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export default function BudgetScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const db = useSQLiteContext();
  const [budget, setBudget] = useState<MonthBudget | null>(null);
  const [stats, setStats] = useState<MonthStats>({ totalExpense: 0, totalIncome: 0 });
  const [editing, setEditing] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const bg = isDark ? '#0D1B16' : '#F7F6F1';
  const card = isDark ? '#173229' : '#FFFFFF';
  const raised = isDark ? '#254A3D' : '#F7F6F1';
  const border = isDark ? '#254A3D' : '#E7E4DD';
  const ink = isDark ? '#F5F5F2' : '#173229';
  const muted = isDark ? '#6D9773' : '#60716A';
  const primary = isDark ? '#6D9773' : '#0C3B2E';
  const secondary = isDark ? '#0C3B2E' : '#6D9773';
  const accent = '#BB8A52';
  const highlight = '#FFBA00';
  const success = '#3A8F5A';
  const danger = '#C44D4D';
  const warning = '#D89B00';
  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const month = currentMonthKey();
      const b = await db.getFirstAsync<MonthBudget>(
        `SELECT * FROM budgets WHERE period = 'monthly' AND month = ? LIMIT 1`, [month]
      );
      setBudget(b || null);

      const expRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`, [month]
      );
      const incRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?`, [month]
      );
      setStats({ totalExpense: expRow?.total || 0, totalIncome: incRow?.total || 0 });
    } catch (e) { console.error(e); }
  };

  const saveBudget = async () => {
    const amount = parseFloat(inputAmount);
    if (!amount || amount <= 0) { Alert.alert('Oops!', 'Please enter a valid budget amount.'); return; }
    try {
      const month = currentMonthKey();
      if (budget) {
        await db.runAsync('UPDATE budgets SET amount = ? WHERE id = ?', [amount, budget.id]);
      } else {
        const id = 'budget-' + Date.now();
        await db.runAsync(
          `INSERT INTO budgets (id, amount, period, month, createdAt) VALUES (?, ?, 'monthly', ?, ?)`,
          [id, amount, month, new Date().toISOString()]
        );
      }
      setEditing(false);
      setInputAmount('');
      loadData();
    } catch (e) { Alert.alert('Oops!', 'We could not save your budget. Please try again.'); }
  };

  const deleteBudget = () => {
    Alert.alert('Remove Budget?', 'This will remove your spending limit for this month.',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Remove', style: 'destructive', onPress: async () => {
         if (budget) {
           await db.runAsync('DELETE FROM budgets WHERE id = ?', [budget.id]);
           setBudget(null);
           loadData();
         }
       }}]);
  };

  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount + stats.totalIncome - stats.totalExpense;
  const spent = stats.totalExpense;
  const pct = budgetAmount > 0 ? Math.min(1, spent / budgetAmount) : 0;
  const isOverBudget = remaining < 0;

  const progressColor = pct >= 0.9 ? danger : pct >= 0.7 ? warning : success;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ backgroundColor: raised, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>Monthly Budget 🎯</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: muted, marginTop: 2 , fontFamily: 'DMSans_500Medium'}}>{monthLabel(currentMonthKey())}</Text>
        </View>
        {budget && !editing && (
          <TouchableOpacity onPress={() => { setInputAmount(String(budget.amount)); setEditing(true); }}
            style={{ backgroundColor: primary + '15', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={18} color={primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Set / Edit Budget */}
        {(!budget || editing) && (
          <View style={{ backgroundColor: card, borderRadius: 22, padding: 22, marginBottom: 20, borderWidth: 2, borderColor: primary + '40' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: ink, marginBottom: 16 , fontFamily: 'CormorantGaramond_700Bold'}}>
              {editing ? 'Edit Budget' : 'Set Monthly Budget'} 📝
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: raised, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: primary, marginRight: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>₹</Text>
              <TextInput
                style={{ flex: 1, fontSize: 32, fontWeight: '900', color: ink, padding: 0, fontVariant: ['tabular-nums'] }}
                placeholder="0" placeholderTextColor={muted}
                keyboardType="numeric" value={inputAmount} onChangeText={setInputAmount}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {editing && (
                <TouchableOpacity onPress={() => { setEditing(false); setInputAmount(''); }} activeOpacity={0.7}
                  style={{ flex: 1, padding: 15, borderRadius: 24, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                  <Text style={{ color: muted, fontWeight: '700', fontSize: 15 , fontFamily: 'DMSans_700Bold'}}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={saveBudget} activeOpacity={0.85}
                style={{ flex: 2, padding: 15, borderRadius: 24, backgroundColor: primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Check size={20} color="#fff" strokeWidth={3} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 , fontFamily: 'CormorantGaramond_700Bold'}}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Budget Overview */}
        {budget && !editing && (
          <>
            {/* Main Budget Card */}
            <View style={{ backgroundColor: card, borderRadius: 22, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>Monthly Budget</Text>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: ink, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                    ₹{budgetAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ backgroundColor: primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: primary , fontFamily: 'CormorantGaramond_700Bold'}}>
                    {Math.round(pct * 100)}% used
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={{ height: 12, backgroundColor: raised, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                <View style={{ height: 12, borderRadius: 6, backgroundColor: progressColor, width: `${Math.min(100, pct * 100)}%` }} />
              </View>

              {/* Stats Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: danger + '12', borderRadius: 14, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <TrendingDown size={15} color={danger} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: danger, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>Spent</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                    ₹{spent.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: (isOverBudget ? danger : success) + '12', borderRadius: 14, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Target size={15} color={isOverBudget ? danger : success} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isOverBudget ? danger : success, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>
                      {isOverBudget ? 'Over' : 'Left'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isOverBudget ? danger : success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                    ₹{Math.abs(remaining).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: success + '12', borderRadius: 14, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <TrendingUp size={15} color={success} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: success, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>Income</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                    ₹{stats.totalIncome.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {isOverBudget && (
                <View style={{ backgroundColor: danger + '15', borderRadius: 14, padding: 14, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 18 , fontFamily: 'DMSans_500Medium'}}>⚠️</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: danger, lineHeight: 20 , fontFamily: 'DMSans_700Bold'}}>
                    You've exceeded your budget by ₹{Math.abs(remaining).toLocaleString('en-IN')} this month!
                  </Text>
                </View>
              )}
            </View>

            {/* Daily Safe Spend */}
            {!isOverBudget && remaining > 0 && (() => {
              const today = new Date();
              const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
              const daily = Math.floor(remaining / daysLeft);
              return (
                <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#A7F3D0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: success, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 , fontFamily: 'CormorantGaramond_700Bold'}}>Daily Safe Spend</Text>
                  <Text style={{ fontSize: 28, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                    ₹{daily.toLocaleString('en-IN')}<Text style={{ fontSize: 15, fontWeight: '700', opacity: 0.8 , fontFamily: 'DMSans_700Bold'}}>/day</Text>
                  </Text>
                  <Text style={{ fontSize: 13, color: success, marginTop: 4, fontWeight: '600' , fontFamily: 'DMSans_500Medium'}}>{daysLeft} days remaining this month</Text>
                </View>
              );
            })()}

            {/* Remove budget */}
            <TouchableOpacity onPress={deleteBudget} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 24, borderWidth: 1, borderColor: danger + '40', backgroundColor: danger + '08' }}>
              <Trash2 size={16} color={danger} />
              <Text style={{ color: danger, fontWeight: '700', fontSize: 14 , fontFamily: 'DMSans_700Bold'}}>Remove this month's budget</Text>
            </TouchableOpacity>
          </>
        )}

        {/* No budget placeholder */}
        {!budget && !editing && (
          <View style={{ backgroundColor: card, borderRadius: 22, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 , fontFamily: 'DMSans_500Medium'}}>🎯</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: ink, marginBottom: 8, textAlign: 'center' , fontFamily: 'CormorantGaramond_700Bold'}}>No budget set yet</Text>
            <Text style={{ fontSize: 14, color: muted, textAlign: 'center', lineHeight: 22 , fontFamily: 'DMSans_500Medium'}}>
              Set a monthly budget above to track how much you're spending vs your limit.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
