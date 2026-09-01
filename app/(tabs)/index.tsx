import { View, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Transaction } from '../../types/database';
import { useFocusEffect } from 'expo-router';
import { useSharedRoomStore } from '../../store/useSharedRoomStore';

import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardAchievements } from '../../components/dashboard/DashboardAchievements';
import { DashboardQuickAdd } from '../../components/dashboard/DashboardQuickAdd';
import { DashboardBudget } from '../../components/dashboard/DashboardBudget';
import { DashboardSummary } from '../../components/dashboard/DashboardSummary';
import { DashboardBorrowLend } from '../../components/dashboard/DashboardBorrowLend';
import { DashboardSharedRooms } from '../../components/dashboard/DashboardSharedRooms';
import { DashboardRecentList } from '../../components/dashboard/DashboardRecentList';
import { Colors } from '../../constants/Colors';

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
  
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const colors = isDark ? Colors.dark : Colors.light;

  const remaining = budgetAmount + income - expense;
  const pct = budgetAmount > 0 ? Math.min(1, expense / budgetAmount) : 0;
  const isOverBudget = remaining < 0;
  const progressColor = pct >= 0.9 ? colors.danger : pct >= 0.7 ? colors.warning : colors.success;
  const progressGradient = pct >= 0.9 ? colors.dangerGradient : pct >= 0.7 ? colors.warningGradient : colors.successGradient;

  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const safeSpend = !isOverBudget && remaining > 0 ? Math.floor(remaining / daysLeft) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        <DashboardHeader 
          userName={userName} 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          colors={colors} 
        />

        <DashboardAchievements 
          levelData={levelData} 
          colors={colors} 
        />

        <DashboardQuickAdd 
          colors={colors} 
        />

        <DashboardBudget 
          budgetAmount={budgetAmount} 
          expense={expense} 
          remaining={remaining} 
          isOverBudget={isOverBudget} 
          pct={pct} 
          progressColor={progressColor} 
          progressGradient={progressGradient}
          colors={colors} 
        />

        <DashboardSummary 
          income={income} 
          expense={expense} 
          safeSpend={safeSpend} 
          isDark={isDark} 
          colors={colors} 
        />

        <DashboardBorrowLend 
          totalBorrowed={totalBorrowed} 
          totalLent={totalLent} 
          colors={colors} 
        />

        <DashboardSharedRooms 
          roomsCount={rooms.length} 
          colors={colors} 
        />

        <DashboardRecentList 
          recentTransactions={recentTransactions} 
          colors={colors} 
        />

      </ScrollView>
    </View>
  );
}
