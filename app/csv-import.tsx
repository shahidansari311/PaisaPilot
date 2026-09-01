import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useState } from 'react';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { File } from 'expo-file-system';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, UploadCloud, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

export default function CSVImport() {
  const isDark = useThemeStore((state) => state.isDark);
  const theme = isDark ? Colors.dark : Colors.light;
  const db = useSQLiteContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ imported: number; failed: number } | null>(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessing(true);
        const fileContent = await new File(result.assets[0].uri).text();
        Papa.parse(fileContent, {
          header: true, skipEmptyLines: true,
          complete: async (parseResult: any) => {
            let imported = 0;
            let failed = 0;
            
            for (const row of parseResult.data) {
              try {
                // Find date
                const rawDate = row.Date || row.date || row.DATE;
                const dateStr = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
                
                // Find note
                const note = row.Description || row.description || row.Narration || row.Note || 'Imported Transaction';
                
                // Find amount and type
                let amount = 0;
                let type = 'expense';
                
                if (row.Type || row.type || row.TYPE) {
                   const t = String(row.Type || row.type || row.TYPE).toLowerCase();
                   type = (t === 'income' || t === 'credit' || t === 'cr') ? 'income' : 'expense';
                   const rawAmt = row['Amount (INR)'] || row.Amount || row.amount || row.AMOUNT;
                   amount = Math.abs(parseFloat(String(rawAmt).replace(/[^0-9.-]+/g, '')) || 0);
                } else if (row.Withdrawal || row.Debit) {
                   type = 'expense';
                   amount = Math.abs(parseFloat(String(row.Withdrawal || row.Debit).replace(/[^0-9.-]+/g, '')) || 0);
                } else if (row.Deposit || row.Credit) {
                   type = 'income';
                   amount = Math.abs(parseFloat(String(row.Deposit || row.Credit).replace(/[^0-9.-]+/g, '')) || 0);
                }

                if (amount > 0 && !isNaN(amount)) {
                   const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                   const categoryId = type === 'expense' ? 'cat-other-exp' : 'cat-other-inc';
                   await db.runAsync(
                     'INSERT INTO transactions (id, accountId, categoryId, amount, type, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                     [txId, 'default-wallet', categoryId, amount, type, dateStr, note, new Date().toISOString()]
                   );
                   imported++;
                } else {
                   // Ignore empty rows
                   if (Object.keys(row).some(k => row[k])) failed++;
                }
              } catch (e) { failed++; }
            }

            try {
              if (imported > 0) {
                await db.runAsync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('has_imported_csv', 'true')`);
              }
            } catch (e) {}

            setIsProcessing(false);
            setResults({ imported, failed: failed + (parseResult.errors ? parseResult.errors.length : 0) });
            Alert.alert('Import Complete', `Successfully imported ${imported} transactions.`);
          },
          error: (error: any) => { setIsProcessing(false); Alert.alert('Parse Error', error.message); }
        });
      }
    } catch (e) { console.error(e); setIsProcessing(false); Alert.alert('Error', 'Failed to pick or process document.'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
          <ArrowLeft size={22} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Import CSV</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        {!results ? (
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={isProcessing}
            activeOpacity={0.7}
            style={{ width: '100%', padding: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: isProcessing ? theme.muted : theme.primary, alignItems: 'center' }}
          >
            <UploadCloud size={56} color={theme.primary} />
            <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '800', color: theme.ink, textAlign: 'center' , fontFamily: 'Outfit_700Bold'}}>
              {isProcessing ? 'Processing...' : 'Upload CSV Statement'}
            </Text>
            <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 8, lineHeight: 20, fontSize: 13 , fontFamily: 'Inter_500Medium'}}>
              Select a bank statement in CSV format. We'll automatically map the columns and import your transactions.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: '100%', backgroundColor: theme.card, padding: 32, borderRadius: 20, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
            <CheckCircle2 size={56} color={theme.success} />
            <Text style={{ marginTop: 20, fontSize: 22, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Import Complete</Text>
            <View style={{ flexDirection: 'row', gap: 48, marginTop: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>{results.imported}</Text>
                <Text style={{ color: theme.muted, marginTop: 4, fontWeight: '600' , fontFamily: 'Inter_500Medium'}}>Imported</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: theme.danger, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>{results.failed}</Text>
                <Text style={{ color: theme.muted, marginTop: 4, fontWeight: '600' , fontFamily: 'Inter_500Medium'}}>Failed</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setResults(null)}
              activeOpacity={0.7}
              style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 18, backgroundColor: theme.surface }}
            >
              <Text style={{ color: theme.ink, fontWeight: '600' , fontFamily: 'Inter_500Medium'}}>Import Another</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
