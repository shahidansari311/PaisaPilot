import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Edit3, Target, TrendingDown, TrendingUp, Trash2, AlertTriangle, Crosshair } from 'lucide-react-native';
import { getMonthRange, getDisplayMonth } from '../utils/dateUtils';
import { useSettingsStore } from '../store/useSettingsStore';

interface MonthBudget {
  id: string;
  amount: number;
  month: string;
}

interface MonthStats {
  totalExpense: number;
  totalIncome: number;
}

export default function BudgetScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const theme = isDark ? Colors.dark : Colors.light;
  const db = useSQLiteContext();
  const [budget, setBudget] = useState<MonthBudget | null>(null);
  const [stats, setStats] = useState<MonthStats>({ totalExpense: 0, totalIncome: 0 });
  const [editing, setEditing] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  
  const { monthStartDay, loadSettings, loaded: settingsLoaded } = useSettingsStore();

  useFocusEffect(useCallback(() => { 
    if (!settingsLoaded) loadSettings(db);
    else loadData(); 
  }, [settingsLoaded, monthStartDay]));

  const loadData = async () => {
    try {
      const { start, end } = getMonthRange(new Date(), monthStartDay);
      const month = `${new Date(start).getFullYear()}-${String(new Date(start).getMonth() + 1).padStart(2, '0')}`;
      
      // Auto-carryover budget
      let b = await db.getFirstAsync<MonthBudget>(
        `SELECT * FROM budgets WHERE period = 'monthly' AND month = ? LIMIT 1`, [month]
      );
      if (!b) {
        // Find most recent budget
        const last = await db.getFirstAsync<MonthBudget>(
          `SELECT * FROM budgets WHERE period = 'monthly' ORDER BY month DESC LIMIT 1`
        );
        if (last && last.month < month) {
          const id = 'budget-' + Date.now();
          await db.runAsync(
            `INSERT INTO budgets (id, amount, period, month, createdAt) VALUES (?, ?, 'monthly', ?, ?)`,
            [id, last.amount, month, new Date().toISOString()]
          );
          b = { id, amount: last.amount, month };
        }
      }
      setBudget(b || null);

      // Check debt toggle
      const setting = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'include_debt_in_stats'`);
      const includeDebt = setting?.value === 'true';

      const expRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= ? AND date < ?`, [start, end]
      );
      const incRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND date >= ? AND date < ?`, [start, end]
      );
      
      let totalExpense = expRow?.total || 0;
      let totalIncome = incRow?.total || 0;

      if (includeDebt) {
        const lentRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM lend_records WHERE createdAt >= ? AND createdAt < ?`, [start, end]);
        const borrowRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM borrow_records WHERE createdAt >= ? AND createdAt < ?`, [start, end]);
        
        totalExpense += (lentRow?.total || 0);
        totalIncome += (borrowRow?.total || 0);
      }
      
      setStats({ totalExpense, totalIncome });
    } catch (e) { console.error(e); }
  };

  const saveBudget = async () => {
    const amount = parseFloat(inputAmount);
    if (!amount || amount <= 0) { Alert.alert('Oops!', 'Please enter a valid budget amount.'); return; }
    try {
      const { start } = getMonthRange(new Date(), monthStartDay);
      const month = `${new Date(start).getFullYear()}-${String(new Date(start).getMonth() + 1).padStart(2, '0')}`;
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

  const progressColor = pct >= 0.9 ? theme.danger : pct >= 0.7 ? theme.warning : theme.success;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ backgroundColor: theme.surface, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ArrowLeft size={18} color={theme.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'FjallaOne_400Regular'}}>Monthly Budget</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted, marginTop: 2 , fontFamily: 'FjallaOne_400Regular'}}>{getDisplayMonth(new Date(), monthStartDay)}</Text>
        </View>
        {budget && !editing && (
          <TouchableOpacity onPress={() => { setInputAmount(String(budget.amount)); setEditing(true); }}
            style={{ backgroundColor: theme.primary + '15', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={16} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Set / Edit Budget */}
        {(!budget || editing) && (
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 2, borderColor: theme.primary + '40' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.ink, marginBottom: 12 , fontFamily: 'FjallaOne_400Regular'}}>
              {editing ? 'Edit Budget' : 'Set Monthly Budget'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.primary, marginRight: 8 , fontFamily: 'FjallaOne_400Regular'}}>₹</Text>
              <TextInput
                style={{ flex: 1, fontSize: 24, fontWeight: '900', color: theme.ink, padding: 0, fontVariant: ['tabular-nums'] }}
                placeholder="0" placeholderTextColor={theme.muted}
                keyboardType="numeric" value={inputAmount} onChangeText={setInputAmount}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {editing && (
                <TouchableOpacity onPress={() => { setEditing(false); setInputAmount(''); }} activeOpacity={0.7}
                  style={{ flex: 1, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                  <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={saveBudget} activeOpacity={0.85}
                style={{ flex: 2, borderRadius: 20, overflow: 'hidden' }}>
                <LinearGradient
                  colors={theme.primaryGradient}
                  start={Gradients.diagonal.start}
                  end={Gradients.diagonal.end}
                  style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Check size={16} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Save Budget</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Budget Overview */}
        {budget && !editing && (
          <>
            {/* Main Budget Card */}
            <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 , fontFamily: 'FjallaOne_400Regular'}}>Monthly Budget</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: theme.ink, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>
                    ₹{budgetAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary , fontFamily: 'FjallaOne_400Regular'}}>
                    {Math.round(pct * 100)}% used
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={{ height: 8, backgroundColor: theme.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: progressColor, width: `${Math.min(100, pct * 100)}%` }} />
              </View>

              {/* Stats Row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: theme.danger + '12', borderRadius: 12, padding: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <TrendingDown size={12} color={theme.danger} />
                    <Text style={{ fontSize: 9, fontWeight: '800', color: theme.danger, textTransform: 'uppercase' , fontFamily: 'FjallaOne_400Regular'}}>Spent</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: theme.danger, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>
                    ₹{spent.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: (isOverBudget ? theme.danger : theme.success) + '12', borderRadius: 12, padding: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Target size={12} color={isOverBudget ? theme.danger : theme.success} />
                    <Text style={{ fontSize: 9, fontWeight: '800', color: isOverBudget ? theme.danger : theme.success, textTransform: 'uppercase' , fontFamily: 'FjallaOne_400Regular'}}>
                      {isOverBudget ? 'Over' : 'Left'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: isOverBudget ? theme.danger : theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>
                    ₹{Math.abs(remaining).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.success + '12', borderRadius: 12, padding: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <TrendingUp size={12} color={theme.success} />
                    <Text style={{ fontSize: 9, fontWeight: '800', color: theme.success, textTransform: 'uppercase' , fontFamily: 'FjallaOne_400Regular'}}>Income</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>
                    ₹{stats.totalIncome.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {isOverBudget && (
                <View style={{ backgroundColor: theme.danger + '15', borderRadius: 12, padding: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color={theme.danger} />
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.danger, lineHeight: 18 , fontFamily: 'FjallaOne_400Regular'}}>
                    You've exceeded your budget by ₹{Math.abs(remaining).toLocaleString('en-IN')} this month!
                  </Text>
                </View>
              )}
            </View>

            {/* Daily Safe Spend */}
            {!isOverBudget && remaining > 0 && (() => {
              const { start, end } = getMonthRange(new Date(), monthStartDay);
              const endDate = new Date(end);
              const startDate = new Date(start);
              const now = new Date();
              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const daily = Math.floor(remaining / Math.max(1, daysLeft));
              return (
                <View style={{ backgroundColor: theme.success + '12', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.success + '25' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.success, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 , fontFamily: 'FjallaOne_400Regular'}}>Daily Safe Spend</Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>
                    ₹{daily.toLocaleString('en-IN')}<Text style={{ fontSize: 13, fontWeight: '700', opacity: 0.8 , fontFamily: 'FjallaOne_400Regular'}}>/day</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.success, marginTop: 4, fontWeight: '600' , fontFamily: 'FjallaOne_400Regular'}}>{daysLeft} of {totalDays} days remaining this cycle</Text>
                </View>
              );
            })()}

            {/* Remove budget */}
            <TouchableOpacity onPress={deleteBudget} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.danger + '40', backgroundColor: theme.danger + '08' }}>
              <Trash2 size={16} color={theme.danger} />
              <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Remove this month's budget</Text>
            </TouchableOpacity>
          </>
        )}

        {/* No budget placeholder */}
        {!budget && !editing && (
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}>
            <Target size={40} color={theme.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.ink, marginBottom: 8, textAlign: 'center' , fontFamily: 'FjallaOne_400Regular'}}>No budget set yet</Text>
            <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'FjallaOne_400Regular'}}>
              Set a monthly budget above to track how much you're spending vs your limit.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
