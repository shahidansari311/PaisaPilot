import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, MessageSquare, RefreshCw } from 'lucide-react-native';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

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
  const theme = isDark ? Colors.dark : Colors.light;
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

  const txColor = parsed?.type === 'expense' ? theme.danger : theme.success;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ marginRight: 14, backgroundColor: theme.surface, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>SMS Parser 📱</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={{ backgroundColor: theme.primary + '15', borderRadius: 18, padding: 16, marginBottom: 20, flexDirection: 'row', gap: 12 }}>
          <MessageSquare size={20} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.primary, marginBottom: 4 , fontFamily: 'Outfit_700Bold'}}>Paste your bank SMS</Text>
            <Text style={{ fontSize: 13, color: theme.primary, opacity: 0.8, lineHeight: 19 , fontFamily: 'Inter_500Medium'}}>
              Copy the SMS from your Messages app and paste it below. We'll extract the amount and type automatically.
            </Text>
          </View>
        </View>

        {/* SMS Input */}
        <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 16, overflow: 'hidden' }}>
          <TextInput
            style={{ padding: 18, color: theme.ink, fontSize: 14, minHeight: 140, textAlignVertical: 'top', lineHeight: 22, fontWeight: '500' }}
            placeholder={'e.g. Your A/c XX1234 is debited by INR 450.00 on 19-07-2026 at ZOMATO UPI Ref:123456789'}
            placeholderTextColor={theme.muted}
            multiline
            value={smsText}
            onChangeText={(t) => { setSmsText(t); setParsed(null); setSaved(false); }}
          />
        </View>

        {/* Parse button */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}
            style={{ backgroundColor: theme.surface, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} color={theme.muted} />
            <Text style={{ color: theme.muted, fontWeight: '700' , fontFamily: 'Inter_700Bold'}}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleParse} activeOpacity={0.85} style={{ flex: 1, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={theme.primaryGradient}
              start={Gradients.diagonal.start}
              end={Gradients.diagonal.end}
              style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <MessageSquare size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 , fontFamily: 'Outfit_700Bold'}}>Extract Data</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Parsed result card */}
        {parsed && (
          <View style={{ backgroundColor: theme.card, borderRadius: 22, borderWidth: 2, borderColor: txColor + '50', overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ height: 5, backgroundColor: txColor }} />
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 , fontFamily: 'Outfit_700Bold'}}>
                {saved ? '✅ Saved!' : 'Detected Transaction'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 6 , fontFamily: 'Inter_700Bold'}}>{parsed.note}</Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: txColor + '20', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: txColor, textTransform: 'capitalize' , fontFamily: 'Outfit_700Bold'}}>{parsed.type}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 30, fontWeight: '900', color: txColor, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
                  {parsed.type === 'expense' ? '−' : '+'}₹{parsed.amount.toLocaleString('en-IN')}
                </Text>
              </View>

              {!saved && (
                <TouchableOpacity onPress={handleSave} activeOpacity={0.85}
                  style={{ backgroundColor: txColor, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={20} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 , fontFamily: 'Outfit_700Bold'}}>Save Transaction</Text>
                </TouchableOpacity>
              )}

              {saved && (
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}
                  style={{ backgroundColor: theme.success, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={20} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 , fontFamily: 'Outfit_700Bold'}}>Done! Go Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
