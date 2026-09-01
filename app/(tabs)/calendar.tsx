import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, TrendingDown, TrendingUp, Download } from 'lucide-react-native';
import { exportTransactionsCSV, exportTransactionsPDF } from '../../utils/export';

interface DayTransaction {
  id: string;
  note: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

interface DayData {
  totalExpense: number;
  totalIncome: number;
  count: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const db = useSQLiteContext();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<Record<string, DayData>>({});
  const [dayTransactions, setDayTransactions] = useState<DayTransaction[]>([]);

  // Theme
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
  useFocusEffect(useCallback(() => {
    loadMonthData(viewYear, viewMonth);
  }, [viewYear, viewMonth]));

  const loadMonthData = async (year: number, month: number) => {
    try {
      // Build YYYY-MM prefix
      const mm = String(month + 1).padStart(2, '0');
      const prefix = `${year}-${mm}`;
      const rows = await db.getAllAsync<{ day: string; type: string; total: number; count: number }>(
        `SELECT strftime('%Y-%m-%d', date) as day, type, SUM(amount) as total, COUNT(*) as count
         FROM transactions
         WHERE day LIKE ?
         GROUP BY day, type`,
        [`${prefix}%`]
      );
      const data: Record<string, DayData> = {};
      for (const row of rows) {
        if (!data[row.day]) data[row.day] = { totalExpense: 0, totalIncome: 0, count: 0 };
        if (row.type === 'expense') data[row.day].totalExpense += row.total;
        else data[row.day].totalIncome += row.total;
        data[row.day].count += row.count;
      }
      setMonthData(data);
    } catch (e) { console.error(e); }
  };

  const loadDayTransactions = async (dateStr: string) => {
    try {
      const txs = await db.getAllAsync<DayTransaction>(
        `SELECT id, note, amount, type, date FROM transactions
         WHERE strftime('%Y-%m-%d', date) = ?
         ORDER BY date DESC`,
        [dateStr]
      );
      setDayTransactions(txs);
    } catch (e) { console.error(e); }
  };

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
    if (dateStr !== selectedDate) loadDayTransactions(dateStr);
  };

  const deleteTransaction = async (id: string, dateStr: string) => {
    try {
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
      loadDayTransactions(dateStr);
      loadMonthData(viewYear, viewMonth);
    } catch (e) { Alert.alert('Oops!', 'We could not delete the transaction.'); }
  };

  const handleAction = (id: string) => {
    Alert.alert(
      'Transaction Actions ⚙️',
      'What would you like to do with this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => router.push({ pathname: '/add-transaction', params: { id } } as any) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id, selectedDate!) },
      ]
    );
  };

  const goMonth = (dir: 1 | -1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m); setViewYear(y);
    setSelectedDate(null); setDayTransactions([]);
  };

  const handleExportMonth = () => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const prefix = `${viewYear}-${mm}`;
    Alert.alert(
      'Export Statement 📊',
      `Download your statement for ${MONTHS[viewMonth]} ${viewYear}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Excel / CSV', onPress: async () => {
            try { await exportTransactionsCSV(db, prefix); }
            catch { Alert.alert('Error', 'Failed to export CSV'); }
        }},
        { text: 'PDF Report', onPress: async () => {
            try { await exportTransactionsPDF(db, prefix); }
            catch { Alert.alert('Error', 'Failed to export PDF'); }
        }}
      ]
    );
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const formatDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Month totals
  const monthExpense = Object.values(monthData).reduce((s, d) => s + d.totalExpense, 0);
  const monthIncome = Object.values(monthData).reduce((s, d) => s + d.totalIncome, 0);

  const addForDate = () => {
    // Navigate to add transaction with selected date pre-filled via search param
    const date = selectedDate || todayStr;
    router.push({ pathname: '/add-transaction', params: { prefillDate: date } } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: border }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: ink, letterSpacing: -1 , fontFamily: 'CormorantGaramond_700Bold'}}>Calendar 📅</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>Tap a day to see spending</Text>
        </View>
        <TouchableOpacity onPress={handleExportMonth} activeOpacity={0.7}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: primary + '30' }}>
          <Download size={20} color={primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Month Navigator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20 }}>
          <TouchableOpacity onPress={() => goMonth(-1)} activeOpacity={0.7}
            style={{ backgroundColor: card, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border }}>
            <ChevronLeft size={22} color={ink} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>{MONTHS[viewMonth]}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>{viewYear}</Text>
          </View>
          <TouchableOpacity onPress={() => goMonth(1)} activeOpacity={0.7}
            style={{ backgroundColor: card, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border }}>
            <ChevronRight size={22} color={ink} />
          </TouchableOpacity>
        </View>

        {/* Month Summary */}
        <View style={{ flexDirection: 'row', marginHorizontal: 24, gap: 16, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: success + '15', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: success + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={16} color={success} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: success, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>In</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} numberOfLines={1} adjustsFontSizeToFit>
              ₹{monthIncome.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: danger + '15', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: danger + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingDown size={16} color={danger} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: danger, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>Out</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} numberOfLines={1} adjustsFontSizeToFit>
              ₹{monthExpense.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={{ marginHorizontal: 20, backgroundColor: card, borderRadius: 28, borderWidth: 1, borderColor: border, padding: 16, marginBottom: 24 }}>
          {/* Day Labels */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAYS.map(d => (
              <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: muted , fontFamily: 'CormorantGaramond_700Bold'}}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid Rows */}
          {Array.from({ length: calCells.length / 7 }, (_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {calCells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                if (!day) return <View key={colIdx} style={{ flex: 1, aspectRatio: 1 }} />;
                const dateStr = formatDateStr(day);
                const data = monthData[dateStr];
                const isToday = dateStr === todayStr;
                const isSelected = selectedDate === dateStr;
                const hasData = !!data;
                const isExpenseDay = hasData && data.totalExpense > 0;
                const isIncomeDay = hasData && data.totalIncome > 0;
                const isFuture = new Date(dateStr) > today;

                return (
                  <TouchableOpacity key={colIdx} onPress={() => !isFuture && handleDayPress(dateStr)}
                    activeOpacity={isFuture ? 1 : 0.75}
                    style={{ flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <View style={{
                      width: '90%', aspectRatio: 1, borderRadius: 100, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isSelected ? primary : isToday ? primary + '20' : 'transparent',
                    }}>
                      <Text style={{
                        fontSize: 14, fontWeight: isToday || isSelected ? '900' : '600',
                        color: isSelected ? '#fff' : isToday ? primary : isFuture ? muted + '60' : ink,
                      }}>{day}</Text>
                    </View>
                    {/* Spending dots */}
                    {hasData && !isSelected && (
                      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                        {isExpenseDay && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: danger }} />}
                        {isIncomeDay && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: success }} />}
                      </View>
                    )}
                    {/* Selected: mini spend label */}
                    {isSelected && data && (
                      <Text style={{ fontSize: 7, fontWeight: '800', color: primary, marginTop: 1 , fontFamily: 'CormorantGaramond_700Bold'}}>
                        ₹{Math.round(data.totalExpense)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Day Detail Panel */}
        {selectedDate && (
          <View style={{ marginHorizontal: 20, backgroundColor: card, borderRadius: 28, borderWidth: 1, borderColor: border, overflow: 'hidden', marginBottom: 24 }}>
            {/* Panel Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: border }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                {monthData[selectedDate] && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                    {monthData[selectedDate].totalExpense > 0 && (
                      <Text style={{ fontSize: 13, fontWeight: '700', color: danger , fontFamily: 'DMSans_700Bold'}}>
                        −₹{monthData[selectedDate].totalExpense.toLocaleString('en-IN')}
                      </Text>
                    )}
                    {monthData[selectedDate].totalIncome > 0 && (
                      <Text style={{ fontSize: 13, fontWeight: '700', color: success , fontFamily: 'DMSans_700Bold'}}>
                        +₹{monthData[selectedDate].totalIncome.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={addForDate} activeOpacity={0.85}
                style={{ backgroundColor: primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}>
                <Plus size={24} color="#fff" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            {/* Transactions for the day */}
            {dayTransactions.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 12 , fontFamily: 'CormorantGaramond_700Bold'}}>🌵</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: ink, marginBottom: 6 , fontFamily: 'DMSans_700Bold'}}>Nothing here</Text>
                <Text style={{ fontSize: 14, color: muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'DMSans_500Medium'}}>
                  Tap the + button to add a transaction for this day.
                </Text>
              </View>
            ) : (
              dayTransactions.map((tx, i) => {
                const isExp = tx.type === 'expense';
                const color = isExp ? danger : success;
                return (
                  <TouchableOpacity key={tx.id} 
                    onLongPress={() => handleAction(tx.id)} delayLongPress={350} activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i < dayTransactions.length - 1 ? 1 : 0, borderBottomColor: border }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color , fontFamily: 'CormorantGaramond_700Bold'}}>{(tx.note || 'T').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: ink, marginBottom: 2 , fontFamily: 'DMSans_700Bold'}} numberOfLines={1}>
                        {tx.note || 'Transaction'}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>
                        {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                      {isExp ? '−' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: danger }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>Expense day</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: success }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>Income day</Text>
          </View>
        </View>
      </ScrollView>

      {/* Global FAB to add today */}
      <TouchableOpacity onPress={addForDate} activeOpacity={0.85} style={{
        position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32,
        backgroundColor: primary, alignItems: 'center', justifyContent: 'center',
        shadowColor: primary, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12
      }}>
        <Plus size={32} color="#fff" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}
