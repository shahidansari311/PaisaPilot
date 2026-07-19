import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, MessageSquare, RefreshCw } from 'lucide-react-native';

interface ParsedTx {
  amount: number;
  type: 'income' | 'expense';
  note: string;
}

function parseSMSText(text: string): ParsedTx | null {
  if (!text.trim()) return null;

  // Extract amount
  const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (!amount || amount <= 0) return null;

  // Determine type
  let type: 'income' | 'expense' = 'expense';
  if (/credited|received|refund|deposited|cashback|added/i.test(text)) type = 'income';
  else if (/debited|spent|paid|deducted|withdrawn|purchase/i.test(text)) type = 'expense';

  // Extract merchant / description
  let note = '';
  const merchantPatterns = [
    /(?:at|to|for|via)\s+([A-Za-z0-9 &\-_.]+?)(?:\s+on|\s+ref|\s+txn|\s+UPI|\s*\.|\s*$)/i,
    /(?:merchant|payee)[:.\s]+([A-Za-z0-9 &\-_]+)/i,
  ];
  for (const p of merchantPatterns) {
    const m = text.match(p);
    if (m?.[1]) { note = m[1].trim().replace(/\s+/g, ' '); break; }
  }
  if (!note) note = type === 'income' ? 'SMS Income' : 'SMS Expense';

  return { amount, type, note };
}

export default function SmsParser() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ParsedTx | null>(null);
  const [saved, setSaved] = useState(false);

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const raised = isDark ? '#334155' : '#F1F5F9';
  const border = isDark ? '#334155' : '#E2E8F0';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const primary = '#8B5CF6';
  const success = '#10B981';
  const danger = '#F43F5E';

  const handleParse = () => {
    if (!smsText.trim()) { Alert.alert('Oops!', 'Please paste an SMS first.'); return; }
    const result = parseSMSText(smsText);
    if (!result) {
      Alert.alert('Could Not Read SMS', 'Please make sure the SMS contains an amount like "INR 450" or "₹450".');
      return;
    }
    setParsed(result);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!parsed) return;
    try {
      const id = 'tx-sms-' + Date.now();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO transactions (id, accountId, categoryId, amount, type, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, 'default-wallet', null, parsed.amount, parsed.type, now, parsed.note, now]
      );
      setSaved(true);
      Alert.alert('Saved! ✅', `We recorded your ${parsed.type} of ₹${parsed.amount} for "${parsed.note}".`);
    } catch (e) {
      console.error(e);
      Alert.alert('Oops!', 'We could not save the transaction. Please try again.');
    }
  };

  const handleReset = () => { setSmsText(''); setParsed(null); setSaved(false); };

  const txColor = parsed?.type === 'expense' ? danger : success;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ marginRight: 14, backgroundColor: raised, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: ink }}>SMS Parser 📱</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={{ backgroundColor: primary + '15', borderRadius: 18, padding: 16, marginBottom: 20, flexDirection: 'row', gap: 12 }}>
          <MessageSquare size={20} color={primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: primary, marginBottom: 4 }}>Paste your bank SMS</Text>
            <Text style={{ fontSize: 13, color: primary, opacity: 0.8, lineHeight: 19 }}>
              Copy the SMS from your Messages app and paste it below. We'll extract the amount and type automatically.
            </Text>
          </View>
        </View>

        {/* SMS Input */}
        <View style={{ backgroundColor: card, borderRadius: 20, borderWidth: 1, borderColor: border, marginBottom: 16, overflow: 'hidden' }}>
          <TextInput
            style={{ padding: 18, color: ink, fontSize: 14, minHeight: 140, textAlignVertical: 'top', lineHeight: 22, fontWeight: '500' }}
            placeholder={'e.g. Your A/c XX1234 is debited by INR 450.00 on 19-07-2026 at ZOMATO UPI Ref:123456789'}
            placeholderTextColor={muted}
            multiline
            value={smsText}
            onChangeText={(t) => { setSmsText(t); setParsed(null); setSaved(false); }}
          />
        </View>

        {/* Parse button */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}
            style={{ backgroundColor: raised, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} color={muted} />
            <Text style={{ color: muted, fontWeight: '700' }}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleParse} activeOpacity={0.85} style={{ flex: 1, backgroundColor: primary, paddingVertical: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <MessageSquare size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Extract Data</Text>
          </TouchableOpacity>
        </View>

        {/* Parsed result card */}
        {parsed && (
          <View style={{ backgroundColor: card, borderRadius: 22, borderWidth: 2, borderColor: txColor + '50', overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ height: 5, backgroundColor: txColor }} />
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                {saved ? '✅ Saved!' : 'Detected Transaction'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 6 }}>{parsed.note}</Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: txColor + '20', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: txColor, textTransform: 'capitalize' }}>{parsed.type}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 30, fontWeight: '900', color: txColor, fontVariant: ['tabular-nums'] }}>
                  {parsed.type === 'expense' ? '−' : '+'}₹{parsed.amount.toLocaleString('en-IN')}
                </Text>
              </View>

              {!saved && (
                <TouchableOpacity onPress={handleSave} activeOpacity={0.85}
                  style={{ backgroundColor: txColor, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={20} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Save Transaction</Text>
                </TouchableOpacity>
              )}

              {saved && (
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}
                  style={{ backgroundColor: success, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={20} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Done! Go Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
