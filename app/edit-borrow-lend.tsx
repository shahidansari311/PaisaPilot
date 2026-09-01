import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check, IndianRupee, HandCoins, PlusCircle, MinusCircle } from 'lucide-react-native';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditBorrowLend() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'borrowed' | 'lent' }>();
  const isDark = useThemeStore((state) => state.isDark);
  const theme = isDark ? Colors.dark : Colors.light;
  const db = useSQLiteContext();

  const [person, setPerson] = useState('');
  const [currentAmount, setCurrentAmount] = useState(0);
  const [actionType, setActionType] = useState<'pay' | 'add'>('pay');
  const [amountStr, setAmountStr] = useState('');
  const [loading, setLoading] = useState(true);

  const table = type === 'borrowed' ? 'borrow_records' : 'lend_records';

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const record = await db.getFirstAsync<{ person: string; amount: number }>(
          `SELECT person, amount FROM ${table} WHERE id = ?`, [id]
        );
        if (record) {
          setPerson(record.person);
          setCurrentAmount(record.amount);
        } else {
          Alert.alert('Error', 'Record not found.');
          router.back();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecord();
  }, [id, table]);

  const onSubmit = async () => {
    const adjustment = parseFloat(amountStr);
    if (isNaN(adjustment) || adjustment <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    try {
      let newAmount = currentAmount;
      if (actionType === 'pay') {
        newAmount -= adjustment;
      } else {
        newAmount += adjustment;
      }

      const finalAmount = Math.max(0, newAmount);
      const newStatus = finalAmount === 0 ? 'settled' : 'pending';

      await db.runAsync(
        `UPDATE ${table} SET amount = ?, status = ? WHERE id = ?`,
        [finalAmount, newStatus, id]
      );
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Oops!', 'We could not update your record. Please try again.');
    }
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  const payColor = type === 'borrowed' ? theme.success : theme.success; 
  const addColor = theme.danger; 
  const activeColor = actionType === 'pay' ? payColor : addColor;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ marginRight: 14, backgroundColor: theme.surface, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'Outfit_700Bold'}}>Update Debt 📝</Text>
      </View>

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Current Info */}
        <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 24, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.warning + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: theme.warning , fontFamily: 'Outfit_700Bold'}}>{person.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.muted, marginBottom: 4 , fontFamily: 'Inter_700Bold'}}>Current Balance with {person}</Text>
          <Text style={{ fontSize: 32, fontWeight: '900', color: theme.ink, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
            ₹{currentAmount.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Action Toggle */}
        <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 5, flexDirection: 'row', borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setActionType('pay')} activeOpacity={0.8}
            style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: actionType === 'pay' ? payColor : 'transparent' }}>
            <MinusCircle size={18} color={actionType === 'pay' ? '#fff' : theme.muted} />
            <Text style={{ fontSize: 15, fontWeight: '900', color: actionType === 'pay' ? '#fff' : theme.muted , fontFamily: 'Outfit_700Bold'}}>
              Log Payment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActionType('add')} activeOpacity={0.8}
            style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: actionType === 'add' ? addColor : 'transparent' }}>
            <PlusCircle size={18} color={actionType === 'add' ? '#fff' : theme.muted} />
            <Text style={{ fontSize: 15, fontWeight: '900', color: actionType === 'add' ? '#fff' : theme.muted , fontFamily: 'Outfit_700Bold'}}>
              Add Amount
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <IndianRupee size={16} color={activeColor} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase' , fontFamily: 'Outfit_700Bold'}}>
              {actionType === 'pay' ? 'Amount Paid (₹)' : 'Extra Amount (₹)'}
            </Text>
          </View>
          <TextInput 
            style={{ backgroundColor: theme.card, borderRadius: 18, padding: 16, color: activeColor, fontSize: 28, fontWeight: '900', borderWidth: 1, borderColor: theme.border, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}
            keyboardType="numeric" 
            placeholder="0" 
            placeholderTextColor={theme.muted + '50'}
            value={amountStr} 
            onChangeText={setAmountStr} 
          />
        </View>

        <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', marginTop: 12 , fontFamily: 'Inter_500Medium'}}>
          {actionType === 'pay' 
            ? `This will reduce the debt amount. If it reaches 0, the record will be settled.`
            : `This will increase the total debt amount.`}
        </Text>

      </ScrollView>

      {/* Submit */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 36, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.card }}>
        <TouchableOpacity onPress={onSubmit} activeOpacity={0.85}
          style={{ shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
          <LinearGradient
            colors={theme.primaryGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 18, borderRadius: 22 }}
          >
            <Check size={22} color="#fff" strokeWidth={3} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 , fontFamily: 'Outfit_700Bold'}}>Update Record 🔒</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
