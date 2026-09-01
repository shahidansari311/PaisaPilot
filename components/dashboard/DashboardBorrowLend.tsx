import { View, Text, TouchableOpacity } from 'react-native';
import { Repeat, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/Colors';

interface Props {
  totalBorrowed: number;
  totalLent: number;
  colors: {
    card: string;
    border: string;
    warning: string;
    ink: string;
    danger: string;
    success: string;
    muted: string;
    warningGradient: readonly [string, string, ...string[]];
  };
}

export function DashboardBorrowLend({ totalBorrowed, totalLent, colors }: Props) {
  return (
    <TouchableOpacity onPress={() => router.navigate('/(tabs)/borrow-lend')} activeOpacity={0.8}
      style={{ marginHorizontal: 20, marginBottom: 32, backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      <LinearGradient
        colors={colors.warningGradient}
        start={Gradients.diagonal.start}
        end={Gradients.diagonal.end}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
      >
        <Repeat size={20} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 6, fontFamily: 'Outfit_700Bold' }}>Homies Owe / You Owe</Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {totalBorrowed > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, fontVariant: ['tabular-nums'], fontFamily: 'Inter_600SemiBold' }}>You owe ₹{totalBorrowed.toLocaleString('en-IN')}</Text>}
          {totalLent > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success, fontVariant: ['tabular-nums'], fontFamily: 'Inter_600SemiBold' }}>Get ₹{totalLent.toLocaleString('en-IN')}</Text>}
          {totalBorrowed === 0 && totalLent === 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, fontFamily: 'Inter_700Bold' }}>All settled 🎉</Text>}
        </View>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}
