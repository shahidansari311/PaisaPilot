import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Moon, Sun, Trash2, FileText, FileSpreadsheet, UploadCloud, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { exportTransactionsCSV, exportTransactionsPDF } from '../utils/export';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings() {
  const { isDark, toggleTheme } = useThemeStore();
  const db = useSQLiteContext();

  const [includeDebt, setIncludeDebt] = useState(false);

  const loadSettings = async () => {
    try {
      const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'include_debt_in_stats'`);
      setIncludeDebt(row?.value === 'true');
    } catch {}
  };

  useFocusEffect(useCallback(() => { loadSettings(); }, []));

  const toggleIncludeDebt = async (val: boolean) => {
    try {
      await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('include_debt_in_stats', ?)`, [val ? 'true' : 'false']);
      setIncludeDebt(val);
    } catch {}
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      if (format === 'csv') await exportTransactionsCSV(db);
      if (format === 'pdf') await exportTransactionsPDF(db);
    } catch (error: any) { 
      Alert.alert('Export Failed', error?.message || 'Something went wrong while exporting your data.'); 
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete Everything?',
      'This will erase all your transactions, budgets, and debts forever. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              const tables = [
                'transactions', 'budgets', 'borrow_records', 'lend_records', 'goals',
                'split_groups', 'split_participants', 'split_expenses', 'split_shares',
                'roommate_ledgers', 'roommate_entries', 'app_settings'
              ];
              await db.withTransactionAsync(async () => {
                for (const table of tables) {
                  await db.runAsync(`DELETE FROM ${table}`);
                }
                await db.runAsync(`DELETE FROM accounts WHERE id != 'default-wallet'`);
                await db.runAsync(`UPDATE accounts SET balance = 0 WHERE id = 'default-wallet'`);
              });
              await AsyncStorage.removeItem('shared_rooms');
              Alert.alert('Done', 'All data has been deleted. Fresh start!');
            } catch (e) {
              console.error(e);
              Alert.alert('Oops!', 'We could not delete your data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const theme = isDark ? Colors.dark : Colors.light;
  const SectionLabel = ({ title }: { title: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1 , fontFamily: 'FjallaOne_400Regular'}}>{title}</Text>
    </View>
  );

  const SettingRow = ({ icon, label, onPress, right, isDanger = false, noBorder = false }: { icon: React.ReactNode; label: string; onPress?: () => void; right?: React.ReactNode; isDanger?: boolean; noBorder?: boolean }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: noBorder ? 0 : 1, borderBottomColor: theme.border }}>
      <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isDanger ? theme.danger + '15' : theme.surface }}>
        {icon}
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDanger ? theme.danger : theme.ink , fontFamily: 'FjallaOne_400Regular'}}>{label}</Text>
      {right !== undefined ? right : <ChevronRight size={16} color={theme.muted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

      <View style={{ paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'FjallaOne_400Regular'}}>Settings</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted, marginTop: 4 , fontFamily: 'FjallaOne_400Regular'}}>Customize your experience</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>

        {/* Appearance */}
        <SectionLabel title="Appearance" />
        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 20 }}>
          <SettingRow
            icon={isDark ? <Moon size={16} color={theme.primary} /> : <Sun size={16} color='#F59E0B' />}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" style={{ transform: [{ scale: 0.8 }] }} />}
            noBorder
          />
        </View>

        <SectionLabel title="Preferences" />
        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 20 }}>
          <SettingRow
            icon={<FileSpreadsheet size={16} color={theme.primary} />}
            label="Include Debt in Monthly Stats"
            right={<Switch value={includeDebt} onValueChange={toggleIncludeDebt} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" style={{ transform: [{ scale: 0.8 }] }} />}
            noBorder
          />
        </View>

        {/* Data & Export */}
        <SectionLabel title="Data & Export" />
        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 20 }}>
          <SettingRow icon={<UploadCloud size={16} color={theme.primary} />} label="Import CSV Statement" onPress={() => router.push('/csv-import')} />
          <SettingRow icon={<FileSpreadsheet size={16} color='#10B981' />} label="Export as Excel / CSV" onPress={() => handleExport('csv')} />
          <SettingRow icon={<FileText size={16} color='#3B82F6' />} label="Generate PDF Report" onPress={() => handleExport('pdf')} noBorder />
        </View>


        {/* Danger Zone */}
        <SectionLabel title="Danger Zone" />
        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1.5, borderColor: theme.danger + '40', overflow: 'hidden', marginBottom: 24 }}>
          <SettingRow
            icon={<Trash2 size={16} color={theme.danger} />}
            label="Delete All Data"
            onPress={handleDeleteAll}
            isDanger
            noBorder
            right={<AlertTriangle size={16} color={theme.danger} />}
          />
        </View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, textAlign: 'center', marginBottom: 8 , fontFamily: 'FjallaOne_400Regular'}}>
          PaisaPilot v1.0.0
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted, textAlign: 'center' , fontFamily: 'FjallaOne_400Regular'}}>Built for students 💜</Text>
      </View>
    </ScrollView>
  );
}
