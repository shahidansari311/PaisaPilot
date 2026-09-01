import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Transaction } from '../../types/database';

interface Props {
  recentTransactions: Transaction[];
  colors: {
    ink: string;
    primary: string;
    card: string;
    border: string;
    muted: string;
    danger: string;
    success: string;
  };
}

export function DashboardRecentList({ recentTransactions, colors }: Props) {
  return (
    <View style={{ marginHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, fontFamily: 'Outfit_700Bold' }}>Recent Moves 🚀</Text>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/transactions')} activeOpacity={0.7}
          style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, fontFamily: 'Outfit_700Bold' }}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
          <Text style={{ fontSize: 36, marginBottom: 12, fontFamily: 'Inter_500Medium' }}>📭</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 8, fontFamily: 'Outfit_700Bold' }}>No moves yet</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter_500Medium' }}>
            Tap "Expense" or "Income" above to record your first transaction.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {recentTransactions.map((tx, i) => {
            const isExp = tx.type === 'expense';
            const txColor = isExp ? colors.danger : colors.success;
            return (
              <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i < recentTransactions.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14, backgroundColor: txColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: txColor, fontFamily: 'Outfit_700Bold' }}>{(tx.note || 'T').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4, fontFamily: 'Inter_700Bold' }} numberOfLines={1}>{tx.note || 'Transaction'}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, fontFamily: 'Inter_500Medium' }}>
                    {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: txColor, fontVariant: ['tabular-nums'], fontFamily: 'Outfit_700Bold' }}>
                  {isExp ? '−' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
