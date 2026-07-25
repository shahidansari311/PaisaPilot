import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Repeat, ChevronRight, Plus, Minus, Moon, Sun, Home, Cloud, Trophy } from 'lucide-react-native';
import { Transaction } from '../../types/database';
import { router, useFocusEffect } from 'expo-router';
import { useSharedRoomStore } from '../../store/useSharedRoomStore';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning ☀️';
  if (h >= 12 && h < 17) return 'Good Afternoon ⚡';
  if (h >= 17 && h < 22) return 'Good Evening 🌇';
  return 'Good Night 🌙';
}

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Dashboard() {
  const { isDark, toggleTheme } = useThemeStore();
  const db = useSQLiteContext();

  const [userName, setUserName] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [levelData, setLevelData] = useState({ level: 1, rank: 'Financial Noob' });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [totalLent, setTotalLent] = useState(0);
  const { rooms, loadRooms, loaded: sharedLoaded } = useSharedRoomStore();

  useEffect(() => { if (!sharedLoaded) loadRooms(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      loadDashboardData();
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(useCallback(() => { loadDashboardData(); }, []));

  const loadDashboardData = async () => {
    try {
      const nameRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_name'`);
      setUserName(nameRow?.value || null);

      const month = currentMonthKey();
      const recent = await db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC LIMIT 5');
      setRecentTransactions(recent);

      const incRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?`, [month]);
      const expRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`, [month]);

      setIncome(incRow?.total || 0);
      setExpense(expRow?.total || 0);

      const budgetRow = await db.getFirstAsync<{ amount: number }>(
        `SELECT amount FROM budgets WHERE period = 'monthly' AND month = ? LIMIT 1`, [month]);
      setBudgetAmount(budgetRow?.amount || 0);

      const bRec = await db.getAllAsync<{ amount: number }>("SELECT amount FROM borrow_records WHERE status = 'pending'");
      const lRec = await db.getAllAsync<{ amount: number }>("SELECT amount FROM lend_records WHERE status = 'pending'");
      setTotalBorrowed(bRec.reduce((a, c) => a + c.amount, 0));
      setTotalLent(lRec.reduce((a, c) => a + c.amount, 0));

      // Achievements calculation
      let unlockedCount = 0;
      const txCountObj = await db.getFirstAsync<{c:number}>('SELECT COUNT(*) as c FROM transactions');
      const txCount = txCountObj?.c || 0;
      if (txCount > 0) unlockedCount++;
      if (txCount >= 7) unlockedCount++;

      if (incRow?.total && expRow?.total && incRow.total > 0 && expRow.total < incRow.total) unlockedCount++;

      const groupCountObj = await db.getFirstAsync<{c:number}>('SELECT COUNT(*) as c FROM split_groups');
      if ((groupCountObj?.c || 0) >= 3) unlockedCount++;

      const csvObj = await db.getFirstAsync<{value:string}>("SELECT value FROM app_settings WHERE key = 'has_imported_csv'");
      if (csvObj?.value === 'true') unlockedCount++;

      const totalIncObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='income'");
      const totalExpObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='expense'");
      const bal = (totalIncObj?.t || 0) - (totalExpObj?.t || 0);
      if (bal >= 1000000) unlockedCount++;

      const level = Math.floor(unlockedCount / 2) + 1;
      const rank = level === 1 ? 'Financial Noob' : level === 2 ? 'Budget Apprentice' : level === 3 ? 'Money Master' : 'Wealth Wizard';
      setLevelData({ level, rank });

    } catch (e) { console.error('Dashboard load failed', e); }
  };
  const bg = isDark ? '#121212' : '#EBF1ED';
  const card = isDark ? '#2D2E2B' : '#FFFFFF';
  const raised = isDark ? '#50605A' : '#EBF1ED';
  const border = isDark ? '#50605A' : '#B9CABE';
  const ink = isDark ? '#EBF1ED' : '#121212';
  const muted = isDark ? '#B9CABE' : '#81938A';
  const primary = isDark ? '#81938A' : '#50605A';
  const secondary = isDark ? '#50605A' : '#81938A';
  const accent = '#50605A';
  const highlight = '#FFBA00';
  const success = '#3A8F5A';
  const danger = '#C44D4D';
  const warning = '#D89B00';
  const remaining = budgetAmount + income - expense;
  const pct = budgetAmount > 0 ? Math.min(1, expense / budgetAmount) : 0;
  const isOverBudget = remaining < 0;
  const progressColor = pct >= 0.9 ? danger : pct >= 0.7 ? warning : success;

  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const safeSpend = !isOverBudget && remaining > 0 ? Math.floor(remaining / daysLeft) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* GREETING */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 13, color: muted, fontWeight: '700', marginBottom: 2 , fontFamily: 'DMSans_700Bold'}}>
              {getGreeting()} • {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>{userName ? userName : 'PaisaPilot 💸'}</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: card, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' }}>
            {isDark ? <Sun size={22} color="#F59E0B" /> : <Moon size={22} color="#8B5CF6" />}
          </TouchableOpacity>
        </View>

        {/* Achievements Header */}
        <TouchableOpacity onPress={() => router.push('/achievements')} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, borderRadius: 24, padding: 16, marginHorizontal: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F59E0B' + '40', shadowColor: '#F59E0B', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B' + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Trophy size={24} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Level {levelData.level}: {levelData.rank}</Text>
            <Text style={{ fontSize: 13, color: muted, marginTop: 2, fontWeight: '600' , fontFamily: 'DMSans_500Medium'}}>Tap to view all badges</Text>
          </View>
          <ChevronRight size={20} color={muted} />
        </TouchableOpacity>

        {/* QUICK ADD BUTTONS */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 16, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/add-transaction', params: { prefillType: 'expense' } } as any)}
            activeOpacity={0.85} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18, backgroundColor: danger, shadowColor: danger, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <Minus size={18} color="#fff" strokeWidth={3} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 , fontFamily: 'CormorantGaramond_700Bold'}}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/add-transaction', params: { prefillType: 'income' } } as any)}
            activeOpacity={0.85} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18, backgroundColor: success, shadowColor: success, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <Plus size={18} color="#fff" strokeWidth={3} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 , fontFamily: 'CormorantGaramond_700Bold'}}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* BUDGET CARD */}
        <TouchableOpacity onPress={() => router.navigate('/budget' as any)} activeOpacity={0.85}
          style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: card, borderRadius: 24, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
          <View style={{ height: 4, backgroundColor: progressColor }} />
          <View style={{ padding: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>This Month's Budget</Text>
                {budgetAmount > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={{ fontSize: 36, fontWeight: '900', color: ink, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                      ₹{Math.abs(remaining).toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>
                      {isOverBudget ? 'over 😬' : 'left 🎯'}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 17, fontWeight: '700', color: muted, marginTop: 4 , fontFamily: 'DMSans_700Bold'}}>No budget set</Text>
                )}
              </View>
              <View style={{ backgroundColor: progressColor + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: progressColor , fontFamily: 'CormorantGaramond_700Bold'}}>
                  {budgetAmount > 0 ? `${Math.round(pct * 100)}%` : 'Set it →'}
                </Text>
              </View>
            </View>

            {budgetAmount > 0 && (
              <>
                <View style={{ height: 12, backgroundColor: raised, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: progressColor, width: `${Math.min(100, pct * 100)}%` }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'SpaceGrotesk_600SemiBold'}}>
                    −₹{expense.toLocaleString('en-IN')} spent
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>of ₹{budgetAmount.toLocaleString('en-IN')}</Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* INCOME / EXPENSE + SAFE SPEND row */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 14, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ backgroundColor: success + '20', width: 32, height: 32, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color={success} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 12, color: muted, fontWeight: '800', textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>In</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{income.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ backgroundColor: danger + '20', width: 32, height: 32, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={16} color={danger} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 12, color: muted, fontWeight: '800', textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>Out</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{expense.toLocaleString('en-IN')}
            </Text>
          </View>
          {safeSpend > 0 && (
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: success + '30' }}>
              <Text style={{ fontSize: 12, color: success, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>Safe/day</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
                ₹{safeSpend.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        {/* BORROW & LEND */}
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/borrow-lend')} activeOpacity={0.8}
          style={{ marginHorizontal: 20, marginBottom: 32, backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ backgroundColor: warning + '20', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Repeat size={20} color={warning} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: ink, marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>Homies Owe / You Owe</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {totalBorrowed > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'SpaceGrotesk_600SemiBold'}}>You owe ₹{totalBorrowed.toLocaleString('en-IN')}</Text>}
              {totalLent > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'SpaceGrotesk_600SemiBold'}}>Get ₹{totalLent.toLocaleString('en-IN')}</Text>}
              {totalBorrowed === 0 && totalLent === 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>All settled 🎉</Text>}
            </View>
          </View>
          <ChevronRight size={20} color={muted} />
        </TouchableOpacity>



        {/* SHARED ROOMS (CLOUD) */}
        {rooms.length > 0 && (
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/split-groups')} activeOpacity={0.8}
            style={{ marginHorizontal: 20, marginBottom: 32, backgroundColor: card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ backgroundColor: '#3B82F6' + '20', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Cloud size={20} color="#3B82F6" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: ink, marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>Shared Rooms ☁️</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B82F6' , fontFamily: 'DMSans_700Bold'}}>{rooms.length} active room{rooms.length > 1 ? 's' : ''} • Live synced</Text>
            </View>
            <ChevronRight size={20} color={muted} />
          </TouchableOpacity>
        )}

        {/* RECENT */}
        <View style={{ marginHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Recent Moves 🚀</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/transactions')} activeOpacity={0.7}
              style={{ backgroundColor: primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: primary , fontFamily: 'CormorantGaramond_700Bold'}}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={{ backgroundColor: card, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 , fontFamily: 'DMSans_500Medium'}}>📭</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: ink, marginBottom: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>No moves yet</Text>
              <Text style={{ fontSize: 14, color: muted, textAlign: 'center', lineHeight: 22 , fontFamily: 'DMSans_500Medium'}}>
                Tap "Expense" or "Income" above to record your first transaction.
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: card, borderRadius: 20, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
              {recentTransactions.map((tx, i) => {
                const isExp = tx.type === 'expense';
                const txColor = isExp ? danger : success;
                return (
                  <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i < recentTransactions.length - 1 ? 1 : 0, borderBottomColor: border }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14, backgroundColor: txColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: txColor , fontFamily: 'CormorantGaramond_700Bold'}}>{(tx.note || 'T').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 4 , fontFamily: 'DMSans_700Bold'}} numberOfLines={1}>{tx.note || 'Transaction'}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: txColor, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                      {isExp ? '−' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
