import { View, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Transaction } from '../../types/database';
import { useFocusEffect } from 'expo-router';
import { useSharedRoomStore } from '../../store/useSharedRoomStore';
import { getMonthKey, getMonthRange, addMonths } from '../../utils/dateUtils';
import { useSettingsStore } from '../../store/useSettingsStore';

import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardAchievements } from '../../components/dashboard/DashboardAchievements';
import { DashboardQuickAdd } from '../../components/dashboard/DashboardQuickAdd';
import { DashboardSummary } from '../../components/dashboard/DashboardSummary';
import { DashboardBorrowLend } from '../../components/dashboard/DashboardBorrowLend';
import { DashboardSharedRooms } from '../../components/dashboard/DashboardSharedRooms';
import { DashboardRecentList } from '../../components/dashboard/DashboardRecentList';
import { Colors } from '../../constants/Colors';



export default function Dashboard() {
  const { isDark, toggleTheme } = useThemeStore();
  const db = useSQLiteContext();

  const [userName, setUserName] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [levelData, setLevelData] = useState({ level: 1, rank: 'Financial Noob' });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [totalLent, setTotalLent] = useState(0);
  const { rooms, loadRooms, loaded: sharedLoaded } = useSharedRoomStore();
  const { monthStartDay, loadSettings, loaded: settingsLoaded } = useSettingsStore();

  useEffect(() => { 
    if (!sharedLoaded) loadRooms(); 
    if (!settingsLoaded) loadSettings(db);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (settingsLoaded) loadDashboardData();
    }, 60000);
    return () => clearInterval(timer);
  }, [currentDate, settingsLoaded, monthStartDay]);

  useFocusEffect(useCallback(() => { 
    if (settingsLoaded) loadDashboardData(); 
  }, [currentDate, settingsLoaded, monthStartDay]));

  const loadDashboardData = async () => {
    try {
      const nameRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_name'`);
      setUserName(nameRow?.value || null);

      const { start, end } = getMonthRange(currentDate, monthStartDay);
      const currentMonthKeyStr = `${new Date(start).getFullYear()}-${String(new Date(start).getMonth() + 1).padStart(2, '0')}`;
      
      const recent = await db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC LIMIT 5');
      setRecentTransactions(recent);

      const incRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND date >= ? AND date < ?`, [start, end]);
      const expRow = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= ? AND date < ?`, [start, end]);

      let calculatedIncome = incRow?.total || 0;
      let calculatedExpense = expRow?.total || 0;

      const debtSetting = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'include_debt_in_stats'`);
      if (debtSetting?.value === 'true') {
        const lentRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM lend_records WHERE createdAt >= ? AND createdAt < ?`, [start, end]);
        const borrowRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM borrow_records WHERE createdAt >= ? AND createdAt < ?`, [start, end]);
        calculatedExpense += (lentRow?.total || 0);
        calculatedIncome += (borrowRow?.total || 0);
      }

      setIncome(calculatedIncome);
      setExpense(calculatedExpense);

      let calcTodayExp = 0;
      const now = new Date();
      if (now.toISOString() >= start && now.toISOString() < end) {
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const todayExpRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date LIKE ?`, [`${todayStr}%`]);
        calcTodayExp = todayExpRow?.total || 0;
        
        if (debtSetting?.value === 'true') {
          const todayLentRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM lend_records WHERE createdAt LIKE ?`, [`${todayStr}%`]);
          calcTodayExp += (todayLentRow?.total || 0);
        }
      }
      setTodayExpense(calcTodayExp);


      const budgetRow = await db.getFirstAsync<{ amount: number }>(
        `SELECT amount FROM budgets WHERE period = 'monthly' AND (month = ? OR month IS NULL OR month = '') LIMIT 1`, [currentMonthKeyStr]);
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

      const { start, end } = getMonthRange(currentDate, monthStartDay);
      const totalIncObj = await db.getFirstAsync<{t:number}>(`SELECT SUM(amount) as t FROM transactions WHERE type='income' AND date >= ? AND date < ?`, [start, end]);
      const totalExpObj = await db.getFirstAsync<{t:number}>(`SELECT SUM(amount) as t FROM transactions WHERE type='expense' AND date >= ? AND date < ?`, [start, end]);
      const bal = (totalIncObj?.t || 0) - (totalExpObj?.t || 0);
      setTotalBalance(bal);
      
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

  const now = new Date();
  const { start: viewStart, end: viewEnd } = getMonthRange(currentDate, monthStartDay);
  const { start: currentStart } = getMonthRange(now, monthStartDay);
  const isCurrentMonth = viewStart === currentStart;

  const endDate = new Date(viewEnd);
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const expensesBeforeToday = isCurrentMonth ? expense - todayExpense : expense;
  const remainingBeforeToday = budgetAmount + income - expensesBeforeToday;

  let safeSpend = 0;
  if (isCurrentMonth && remainingBeforeToday > 0) {
    safeSpend = Math.floor(remainingBeforeToday / Math.max(1, daysLeft));
  } else if (!isCurrentMonth && remaining > 0) {
    safeSpend = Math.floor(remaining / Math.max(1, daysLeft));
  }


  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const prevMonth = () => {
    setCurrentDate(prev => addMonths(prev, -1));
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <DashboardHeader 
        userName={userName} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        colors={colors} 
        totalBalance={remaining}
        currentDate={currentDate}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        isCurrentMonth={isCurrentMonth}
      />

      <DashboardAchievements 
        levelData={levelData} 
        colors={colors} 
      />

      <DashboardQuickAdd 
        colors={colors} 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false} bounces={false}>

        <DashboardSummary 
          income={income} 
          expense={expense} 
          safeSpend={safeSpend} 
          todayExpense={todayExpense}
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
