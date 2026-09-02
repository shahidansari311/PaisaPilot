import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, MessageSquare, RefreshCw } from 'lucide-react-native';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { guessCategoryId } from '../utils/autoCategorize';

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
      const categoryId = guessCategoryId(parsed.note, parsed.type);
      
      await db.runAsync(
        `INSERT INTO transactions (id, accountId, categoryId, amount, type, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, 'default-wallet', categoryId, parsed.amount, parsed.type, now, parsed.note, now]
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
      <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ marginRight: 12, backgroundColor: theme.surface, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>SMS Parser 📱</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={{ backgroundColor: theme.primary + '15', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
          <MessageSquare size={16} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary, marginBottom: 2 , fontFamily: 'Outfit_700Bold'}}>Paste your bank SMS</Text>
            <Text style={{ fontSize: 11, color: theme.primary, opacity: 0.8, lineHeight: 16 , fontFamily: 'Inter_500Medium'}}>
              Copy the SMS from your Messages app and paste it below. We'll extract the amount and type automatically.
            </Text>
          </View>
        </View>

        {/* SMS Input */}
        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 16, overflow: 'hidden' }}>
          <TextInput
            style={{ padding: 14, color: theme.ink, fontSize: 13, minHeight: 100, textAlignVertical: 'top', lineHeight: 20, fontWeight: '500' }}
            placeholder={'e.g. Your A/c XX1234 is debited by INR 450.00 on 19-07-2026 at ZOMATO UPI Ref:123456789'}
            placeholderTextColor={theme.muted}
            multiline
            value={smsText}
            onChangeText={(t) => { setSmsText(t); setParsed(null); setSaved(false); }}
          />
        </View>

        {/* Parse button */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}
            style={{ backgroundColor: theme.surface, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} color={theme.muted} />
            <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleParse} activeOpacity={0.85} style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient
              colors={theme.primaryGradient}
              start={Gradients.diagonal.start}
              end={Gradients.diagonal.end}
              style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <MessageSquare size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 , fontFamily: 'Outfit_700Bold'}}>Extract Data</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Parsed result card */}
        {parsed && (
          <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 2, borderColor: txColor + '50', overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ height: 4, backgroundColor: txColor }} />
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 , fontFamily: 'Outfit_700Bold'}}>
                {saved ? '✅ Saved!' : 'Detected Transaction'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.ink, marginBottom: 4 , fontFamily: 'Inter_700Bold'}}>{parsed.note}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, backgroundColor: txColor + '20', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: txColor, textTransform: 'capitalize' , fontFamily: 'Outfit_700Bold'}}>{parsed.type}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: txColor, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
                  {parsed.type === 'expense' ? '−' : '+'}₹{parsed.amount.toLocaleString('en-IN')}
                </Text>
              </View>

              {!saved && (
                <TouchableOpacity onPress={handleSave} activeOpacity={0.85}
                  style={{ backgroundColor: txColor, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={16} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 , fontFamily: 'Outfit_700Bold'}}>Save Transaction</Text>
                </TouchableOpacity>
              )}

              {saved && (
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}
                  style={{ backgroundColor: theme.success, padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={20} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 , fontFamily: 'Outfit_700Bold'}}>Done! Go Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
