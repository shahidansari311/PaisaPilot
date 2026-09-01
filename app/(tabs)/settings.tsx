import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { Moon, Sun, Trash2, FileText, FileSpreadsheet, UploadCloud, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { exportTransactionsCSV, exportTransactionsPDF } from '../../utils/export';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings() {
  const { isDark, toggleTheme } = useThemeStore();
  const db = useSQLiteContext();

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      if (format === 'csv') await exportTransactionsCSV(db);
      if (format === 'pdf') await exportTransactionsPDF(db);
    } catch { Alert.alert('Oops!', 'Something went wrong while exporting your data.'); }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete Everything? ⚠️',
      'This will erase all your transactions, budgets, and debts forever. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.execAsync(`
                DELETE FROM transactions;
                DELETE FROM budgets;
                DELETE FROM borrow_records;
                DELETE FROM lend_records;
                DELETE FROM goals;
                DELETE FROM reminders;
                DELETE FROM subscriptions;
                DELETE FROM split_groups;
                DELETE FROM split_participants;
                DELETE FROM split_expenses;
                DELETE FROM split_shares;
                DELETE FROM roommate_ledgers;
                DELETE FROM roommate_entries;
                DELETE FROM app_settings;
                DELETE FROM accounts WHERE id != 'default-wallet';
                UPDATE accounts SET balance = 0 WHERE id = 'default-wallet';
              `);
              await AsyncStorage.removeItem('shared_rooms');
              Alert.alert('Done 🗑️', 'All data has been deleted. Fresh start!');
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
  const SectionLabel = ({ emoji, title }: { emoji: string; title: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
      <Text style={{ fontSize: 18 , fontFamily: 'Inter_500Medium'}}>{emoji}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.5 , fontFamily: 'Outfit_700Bold'}}>{title}</Text>
    </View>
  );

  const SettingRow = ({ icon, label, onPress, right, isDanger = false, noBorder = false }: { icon: React.ReactNode; label: string; onPress?: () => void; right?: React.ReactNode; isDanger?: boolean; noBorder?: boolean }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 16, borderBottomWidth: noBorder ? 0 : 1, borderBottomColor: theme.border }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isDanger ? theme.danger + '15' : theme.surface }}>
        {icon}
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: isDanger ? theme.danger : theme.ink , fontFamily: 'Inter_700Bold'}}>{label}</Text>
      {right !== undefined ? right : <ChevronRight size={18} color={theme.muted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: theme.ink, letterSpacing: -1 , fontFamily: 'Outfit_700Bold'}}>Settings ⚙️</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, marginTop: 4 , fontFamily: 'Inter_500Medium'}}>Customize your experience</Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>

        {/* Appearance */}
        <SectionLabel emoji="🎨" title="Appearance" />
        <View style={{ backgroundColor: theme.card, borderRadius: 28, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 32 }}>
          <SettingRow
            icon={isDark ? <Moon size={20} color={theme.primary} /> : <Sun size={20} color='#F59E0B' />}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />}
            noBorder
          />
        </View>



        {/* Data & Export */}
        <SectionLabel emoji="📤" title="Data & Export" />
        <View style={{ backgroundColor: theme.card, borderRadius: 28, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 32 }}>
          <SettingRow icon={<UploadCloud size={20} color={theme.primary} />} label="Import CSV Statement" onPress={() => router.push('/csv-import')} />
          <SettingRow icon={<FileSpreadsheet size={20} color='#10B981' />} label="Export as Excel / CSV" onPress={() => handleExport('csv')} />
          <SettingRow icon={<FileText size={20} color='#3B82F6' />} label="Generate PDF Report" onPress={() => handleExport('pdf')} noBorder />
        </View>

        {/* Danger Zone */}
        <SectionLabel emoji="⚠️" title="Danger Zone" />
        <View style={{ backgroundColor: theme.card, borderRadius: 28, borderWidth: 1.5, borderColor: theme.danger + '40', overflow: 'hidden', marginBottom: 24 }}>
          <SettingRow
            icon={<Trash2 size={20} color={theme.danger} />}
            label="Delete All Data"
            onPress={handleDeleteAll}
            isDanger
            noBorder
            right={<AlertTriangle size={18} color={theme.danger} />}
          />
        </View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, textAlign: 'center', marginBottom: 8 , fontFamily: 'Inter_500Medium'}}>
          PaisaPilot v1.0.0
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted, textAlign: 'center' , fontFamily: 'Inter_500Medium'}}>Built for students 💜</Text>
      </View>
    </ScrollView>
  );
}
