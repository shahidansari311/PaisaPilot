import { View, Text, TouchableOpacity } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Transaction } from '../../types/database';
import { FlashList } from '@shopify/flash-list';
import { Link, router, useFocusEffect } from 'expo-router';
import { Plus, ReceiptText, Coffee, Car, ShoppingBag, Book, Heart, FileText, Smile, MoreHorizontal, Briefcase, Laptop, Gift, CircleDashed } from 'lucide-react-native';

const IconMap: Record<string, any> = {
  coffee: Coffee, car: Car, bag: ShoppingBag, book: Book, heart: Heart, 
  file: FileText, smile: Smile, more: MoreHorizontal, briefcase: Briefcase, 
  laptop: Laptop, gift: Gift
};

type TxWithCategory = Transaction & { categoryName?: string; categoryIcon?: string; categoryColor?: string; };

export default function Transactions() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<TxWithCategory[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      const allTx = await db.getAllAsync<TxWithCategory>(`
        SELECT t.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor 
        FROM transactions t 
        LEFT JOIN categories c ON t.categoryId = c.id 
        ORDER BY date DESC
      `);
      setTransactions(allTx);
    } catch (e) { console.error(e); }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
      loadTransactions();
    } catch (e) {
      console.error('Delete failed', e);
      Alert.alert('Oops!', 'We could not delete the transaction. Please try again.');
      Alert.alert('Oops!', 'We could not delete this transaction. Please try again.');
    }
  };

  const handleAction = (id: string) => {
    Alert.alert(
      'Transaction Actions ⚙️',
      'What would you like to do with this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => router.navigate({ pathname: '/add-transaction', params: { id } } as any) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
      ]
    );
  };

  // Modern Student Theme Tokens
  const bg = isDark ? '#0D1B16' : '#F7F6F1';
  const card = isDark ? '#173229' : '#FFFFFF';
  const raised = isDark ? '#254A3D' : '#F7F6F1';
  const border = isDark ? '#254A3D' : '#E7E4DD';
  const ink = isDark ? '#F5F5F2' : '#173229';
  const muted = isDark ? '#6D9773' : '#60716A';
  const primary = isDark ? '#6D9773' : '#0C3B2E';
  const secondary = isDark ? '#0C3B2E' : '#6D9773';
  const accent = '#BB8A52';
  const highlight = '#FFBA00';
  const success = '#3A8F5A';
  const danger = '#C44D4D';
  const warning = '#D89B00';
  const renderItem = ({ item }: { item: TxWithCategory }) => {
    const isExp = item.type === 'expense';
    const amountColor = isExp ? danger : success;
    
    // Category Fallbacks
    const catColor = item.categoryColor || amountColor;
    const initial = (item.note || 'T').charAt(0).toUpperCase();
    const IconComp = item.categoryIcon ? (IconMap[item.categoryIcon] || CircleDashed) : null;

    return (
      <TouchableOpacity
        onLongPress={() => handleAction(item.id)}
        delayLongPress={350}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 16,
          backgroundColor: card,
          marginBottom: 12,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: border,
          shadowColor: ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2
        }}
      >
        <View style={{
          width: 52, height: 52, borderRadius: 26, marginRight: 14,
          backgroundColor: catColor + '20', alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: catColor + '40'
        }}>
          {IconComp ? <IconComp size={22} color={catColor} strokeWidth={2.5} /> : <Text style={{ fontSize: 20, fontWeight: '900', color: catColor , fontFamily: 'CormorantGaramond_700Bold'}}>{initial}</Text>}
        </View>
        
        <View style={{ flex: 1, marginRight: 10 , fontFamily: 'DMSans_500Medium'}}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: ink, marginBottom: 4 , fontFamily: 'CormorantGaramond_700Bold'}} numberOfLines={1}>
            {item.note || 'Transaction'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 , fontFamily: 'DMSans_500Medium'}}>
            {item.categoryName && (
              <View style={{ backgroundColor: raised, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 , fontFamily: 'DMSans_500Medium'}}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: muted, textTransform: 'uppercase' , fontFamily: 'DMSans_700Bold'}}>{item.categoryName}</Text>
              </View>
            )}
            <Text style={{ fontSize: 12, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
        
        <View style={{ alignItems: 'flex-end' , fontFamily: 'DMSans_500Medium'}}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: amountColor, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
            {isExp ? '−' : '+'}₹{item.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg , fontFamily: 'DMSans_500Medium'}}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: border, backgroundColor: bg, zIndex: 10 , fontFamily: 'DMSans_500Medium'}}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: ink, letterSpacing: -1 , fontFamily: 'CormorantGaramond_700Bold'}}>History 📜</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>
          {transactions.length} total move{transactions.length !== 1 ? 's' : ''} • Long press to edit/delete
        </Text>
      </View>

      {/* List Card */}
      <View style={{ flex: 1, marginHorizontal: 20, marginTop: 10 , fontFamily: 'DMSans_500Medium'}}>
        <FlashList
          data={transactions}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          // @ts-ignore
          estimatedItemSize={90}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 100, paddingHorizontal: 40 , fontFamily: 'DMSans_500Medium'}}>
              <View style={{
                width: 88, height: 88, borderRadius: 44, marginBottom: 24,
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: border, borderStyle: 'dashed'
              }}>
                <ReceiptText size={40} color={muted} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: ink, marginBottom: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>Ghost town 👻</Text>
              <Text style={{ fontSize: 15, color: muted, textAlign: 'center', lineHeight: 22, fontWeight: '500' , fontFamily: 'DMSans_500Medium'}}>
                Every rupee you spend or earn will show up here. Add one now!
              </Text>
            </View>
          }
        />
      </View>

      {/* FAB */}
      <Link href="/add-transaction" asChild>
        <TouchableOpacity activeOpacity={0.85} style={{
          position: 'absolute', bottom: 32, right: 24,
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: primary, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12
        }}>
          <Plus size={32} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
