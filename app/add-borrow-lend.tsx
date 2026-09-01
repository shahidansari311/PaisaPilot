import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { ArrowLeft, Check, User, Phone, IndianRupee, Calendar, FileText } from 'lucide-react-native';

const formSchema = z.object({
  type: z.enum(['borrowed', 'lent']),
  person: z.string().min(1, 'Person name is required'),
  phone: z.string().optional(),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function AddBorrowLend() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { type: 'borrowed', amount: 0, dueDate: new Date().toISOString().split('T')[0] }
  });

  const selectedType = watch('type');

  const onSubmit = async (data: FormData) => {
    try {
      const id = 'bl-' + Date.now();
      const date = new Date().toISOString();
      const table = data.type === 'borrowed' ? 'borrow_records' : 'lend_records';
      const cleanPhone = data.phone?.replace(/\D/g, '') || null;
      await db.runAsync(
        `INSERT INTO ${table} (id, person, phone, amount, dueDate, notes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [id, data.person, cleanPhone, data.amount, data.dueDate, data.notes || '', date]
      );
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Oops!', 'We could not save your record. Please try again.');
    }
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
  const activeAccent = selectedType === 'borrowed' ? danger : success;

  const Field = ({ icon, label, error, children }: { icon: React.ReactNode; label: string; error?: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>{label}</Text>
      </View>
      {children}
      {error && <Text style={{ color: danger, fontSize: 12, fontWeight: '600', marginTop: 6 , fontFamily: 'DMSans_500Medium'}}>{error}</Text>}
    </View>
  );

  const inputStyle = { backgroundColor: card, borderRadius: 18, padding: 16, color: ink, fontSize: 16, fontWeight: '600' as const, borderWidth: 1, borderColor: border };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ marginRight: 14, backgroundColor: raised, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>Track Debt 📝</Text>
      </View>

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Type Toggle */}
        <View style={{ backgroundColor: raised, borderRadius: 18, padding: 5, flexDirection: 'row', borderWidth: 1, borderColor: border, marginBottom: 24 }}>
          {(['borrowed', 'lent'] as const).map(t => {
            const c = t === 'borrowed' ? danger : success;
            const active = selectedType === t;
            return (
              <TouchableOpacity key={t} onPress={() => setValue('type', t)} activeOpacity={0.8}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: active ? c : 'transparent' }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: active ? '#fff' : muted , fontFamily: 'CormorantGaramond_700Bold'}}>
                  {t === 'borrowed' ? 'I Borrowed 🤲' : 'I Lent 💸'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Field icon={<User size={16} color={muted} />} label="Person Name" error={errors.person?.message}>
          <Controller control={control} name="person" render={({ field: { onChange, value } }) => (
            <TextInput style={inputStyle} placeholder="e.g. Arjun Sharma" placeholderTextColor={muted} value={value} onChangeText={onChange} />
          )} />
        </Field>

        <Field icon={<Phone size={16} color={'#25D366'} />} label="WhatsApp Number (for reminders)">
          <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, borderRadius: 18, borderWidth: 1, borderColor: border, paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: muted, marginRight: 8 , fontFamily: 'DMSans_700Bold'}}>+91</Text>
              <TextInput
                style={{ flex: 1, paddingVertical: 16, color: ink, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] }}
                placeholder="9876543210 (optional)"
                placeholderTextColor={muted}
                keyboardType="phone-pad"
                maxLength={10}
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
              />
            </View>
          )} />
          <Text style={{ fontSize: 12, color: muted, marginTop: 6, fontWeight: '500' , fontFamily: 'DMSans_500Medium'}}>
            💬 Saves their number for quick WhatsApp reminders
          </Text>
        </Field>

        <Field icon={<IndianRupee size={16} color={activeAccent} />} label="Amount (₹)" error={errors.amount?.message}>
          <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
            <TextInput style={{ ...inputStyle, fontSize: 28, fontWeight: '900', color: activeAccent, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}
              keyboardType="numeric" placeholder="0" placeholderTextColor={isDark ? '#334155' : '#CBD5E1'}
              value={value ? value.toString() : ''} onChangeText={onChange} />
          )} />
        </Field>

        <Field icon={<Calendar size={16} color={muted} />} label="Due Date (YYYY-MM-DD)" error={errors.dueDate?.message}>
          <Controller control={control} name="dueDate" render={({ field: { onChange, value } }) => (
            <TextInput style={inputStyle} placeholder="2026-12-31" placeholderTextColor={muted} value={value} onChangeText={onChange} keyboardType="numeric" />
          )} />
          {/* Quick shortcuts */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { label: '1 week', days: 7 }, { label: '2 weeks', days: 14 },
              { label: '1 month', days: 30 }, { label: '3 months', days: 90 },
            ].map(({ label, days }) => {
              const d = new Date(); d.setDate(d.getDate() + days);
              const val = d.toISOString().split('T')[0];
              return (
                <TouchableOpacity key={label} onPress={() => setValue('dueDate', val)} activeOpacity={0.7}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: border, backgroundColor: raised }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        <Field icon={<FileText size={16} color={muted} />} label="Note (optional)">
          <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
            <TextInput style={inputStyle} placeholder="e.g. For concert tickets 🎸" placeholderTextColor={muted} value={value} onChangeText={onChange} />
          )} />
        </Field>

      </ScrollView>

      {/* Submit */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 36, borderTopWidth: 1, borderTopColor: border, backgroundColor: card }}>
        <TouchableOpacity onPress={handleSubmit(onSubmit as any)} activeOpacity={0.85}
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 18, borderRadius: 22, backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
          <Check size={22} color="#fff" strokeWidth={3} />
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 , fontFamily: 'CormorantGaramond_700Bold'}}>Save Record 🔒</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
