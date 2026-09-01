import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Calendar } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Category, Transaction } from '../types/database';

const transactionSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  note: z.string().optional(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Please enter a date'),
});
type TransactionForm = z.infer<typeof transactionSchema>;

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = () => getLocalDateString();

export default function AddTransaction() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id?: string; prefillDate?: string; prefillType?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const defaultType = (params.prefillType === 'income' ? 'income' : 'expense') as 'income' | 'expense';

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: { type: defaultType, amount: 0, date: params.prefillDate || todayStr() }
  });

  const selectedType = watch('type');
  const selectedCategoryId = watch('categoryId');
  const selectedDate = watch('date');

  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { if (params.prefillDate) setValue('date', params.prefillDate); }, [params.prefillDate]);

  const loadOptions = async () => {
    try {
      setCategories(await db.getAllAsync<Category>('SELECT * FROM categories'));
      if (params.id) {
        const tx = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [params.id]);
        if (tx) {
          setIsEditing(true);
          setValue('type', tx.type as 'income' | 'expense');
          setValue('amount', tx.amount);
          setValue('note', tx.note || '');
          setValue('categoryId', tx.categoryId || undefined);
          setValue('date', tx.date.split('T')[0]);
        }
      }
    } catch (e) { console.error(e); }
  };

  const validateDate = (dateStr: string): Date | null => {
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  };

  const onSubmit = async (data: TransactionForm) => {
    const parsedDate = validateDate(data.date);
    if (!parsedDate) { Alert.alert('Oops!', 'Please enter a valid date like 2026-12-31.'); return; }
    if (parsedDate > new Date()) { Alert.alert('Hold on!', 'You cannot add a transaction for a future date.'); return; }
    try {
      // Fix timezone bug: store literal local time string so SQLite sees the exact YYYY-MM-DD
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
      const finalDateString = `${data.date}T${timeStr}`; 

      if (isEditing && params.id) {
        await db.runAsync(
          `UPDATE transactions SET categoryId = ?, amount = ?, type = ?, date = ?, note = ? WHERE id = ?`,
          [data.categoryId || null, data.amount, data.type, finalDateString, data.note || '', params.id]
        );
      } else {
        const id = 'tx-' + Date.now();
        await db.runAsync(
          `INSERT INTO transactions (id, accountId, categoryId, amount, type, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, 'default-wallet', data.categoryId || null, data.amount, data.type, finalDateString, data.note || '', now.toISOString()]
        );
      }
      router.back();
    } catch (e) { console.error(e); Alert.alert('Oops!', 'We could not save your transaction. Please try again.'); }
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
  const isExpense = selectedType === 'expense';
  const primaryColor = isExpense ? danger : success;
  const typeCategories = categories.filter(c => c.type === selectedType);
  const isDateToday = selectedDate === todayStr();

  const dateDisplay = (() => {
    const d = validateDate(selectedDate);
    if (!d) return selectedDate;
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border, zIndex: 10 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ marginRight: 14, backgroundColor: raised, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>
            {isEditing ? 'Edit Record 📝' : (isExpense ? 'Add Expense 💸' : 'Add Income 💰')}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: muted, marginTop: 2 , fontFamily: 'DMSans_500Medium'}}>{dateDisplay}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>

        {/* Type Toggle */}
        <View style={{ marginHorizontal: 20, backgroundColor: raised, borderRadius: 18, padding: 5, flexDirection: 'row', borderWidth: 1, borderColor: border, marginBottom: 20 }}>
          {(['expense', 'income'] as const).map(type => {
            const c = type === 'expense' ? danger : success;
            const isActive = selectedType === type;
            return (
              <TouchableOpacity key={type} onPress={() => { setValue('type', type); setValue('categoryId', undefined); }} activeOpacity={0.8}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: isActive ? c : 'transparent' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isActive ? '#fff' : muted, textTransform: 'uppercase', letterSpacing: 0.8 , fontFamily: 'CormorantGaramond_700Bold'}}>
                  {type === 'expense' ? 'Outflow 💸' : 'Inflow 💰'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount */}
        <View style={{ marginHorizontal: 20, backgroundColor: card, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: border, marginBottom: 18 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 , fontFamily: 'CormorantGaramond_700Bold'}}>How much?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 40, fontWeight: '900', color: primaryColor, marginRight: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>₹</Text>
            <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
              <TextInput style={{ flex: 1, fontSize: 48, fontWeight: '900', color: primaryColor, padding: 0, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}
                keyboardType="numeric" placeholder="0" placeholderTextColor={isDark ? '#334155' : '#CBD5E1'}
                value={value ? value.toString() : ''} onChangeText={onChange} />
            )} />
          </View>
          {errors.amount && <Text style={{ color: danger, fontSize: 12, fontWeight: '600', marginTop: 6 , fontFamily: 'DMSans_500Medium'}}>{errors.amount.message}</Text>}
        </View>

        {/* Note */}
        <View style={{ marginHorizontal: 20, backgroundColor: card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 18 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 , fontFamily: 'CormorantGaramond_700Bold'}}>What was it for?</Text>
          <Controller control={control} name="note" render={({ field: { onChange, value } }) => (
            <TextInput style={{ fontSize: 17, fontWeight: '600', color: ink, padding: 0 , fontFamily: 'DMSans_500Medium'}}
              placeholder={isExpense ? 'e.g. Late night pizza 🍕' : 'e.g. Pocket money 💵'}
              placeholderTextColor={muted} value={value} onChangeText={onChange} />
          )} />
        </View>

        {/* Date */}
        <View style={{ marginHorizontal: 20, backgroundColor: card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: border, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Calendar size={16} color={primary} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>Date</Text>
            {!isDateToday && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: primary + '20' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: primary , fontFamily: 'CormorantGaramond_700Bold'}}>Past Entry</Text>
              </View>
            )}
          </View>
          <Controller control={control} name="date" render={({ field: { onChange, value } }) => (
            <TextInput style={{ fontSize: 18, fontWeight: '800', color: ink, padding: 0, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}
              placeholder="YYYY-MM-DD" placeholderTextColor={muted} value={value} onChangeText={onChange} keyboardType="numeric" />
          )} />
          {/* Quick shortcuts */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Today', val: todayStr() },
              { label: 'Yesterday', val: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getLocalDateString(d); })() },
              { label: '2d ago', val: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return getLocalDateString(d); })() },
              { label: 'Last week', val: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return getLocalDateString(d); })() },
            ].map(({ label, val }) => (
              <TouchableOpacity key={label} onPress={() => setValue('date', val)} activeOpacity={0.75}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1.5, backgroundColor: selectedDate === val ? primary : 'transparent', borderColor: selectedDate === val ? primary : border }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: selectedDate === val ? '#fff' : muted , fontFamily: 'DMSans_700Bold'}}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 , fontFamily: 'CormorantGaramond_700Bold'}}>Category (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {typeCategories.map(cat => {
              const sel = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity key={cat.id} onPress={() => setValue('categoryId', sel ? undefined : cat.id)} activeOpacity={0.7}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 2, backgroundColor: sel ? primaryColor : 'transparent', borderColor: sel ? primaryColor : border }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: sel ? '#fff' : ink , fontFamily: 'DMSans_700Bold'}}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 36, borderTopWidth: 1, borderTopColor: border, backgroundColor: card }}>
        <TouchableOpacity onPress={handleSubmit(onSubmit as any)} activeOpacity={0.85}
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 18, borderRadius: 22, backgroundColor: primaryColor, shadowColor: primaryColor, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
          <Check size={22} color="#fff" strokeWidth={3} />
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 , fontFamily: 'CormorantGaramond_700Bold'}}>{isEditing ? 'Save Changes 💾' : 'Lock it in 🔒'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
