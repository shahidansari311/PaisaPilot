import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/Colors';

interface Props {
  income: number;
  expense: number;
  safeSpend: number;
  isDark: boolean;
  colors: {
    card: string;
    border: string;
    success: string;
    successGradient: readonly [string, string, ...string[]];
    muted: string;
    danger: string;
    dangerGradient: readonly [string, string, ...string[]];
    primaryGradient: readonly [string, string, ...string[]];
    ink: string;
  };
}

export function DashboardSummary({ income, expense, safeSpend, isDark, colors }: Props) {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      
      {/* Section Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, fontFamily: 'Outfit_700Bold' }}>Your Money</Text>
      </View>

      {/* Income & Expense Cards */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
        
        {/* Income Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <TrendingUp size={20} color={colors.success} strokeWidth={2.5} />
          </View>
          <Text style={[styles.label, { color: colors.muted }]}>Income</Text>
          <Text style={[styles.amount, { color: colors.ink }]} adjustsFontSizeToFit numberOfLines={1}>
            ₹{income.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Expense Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
            <TrendingDown size={20} color={colors.danger} strokeWidth={2.5} />
          </View>
          <Text style={[styles.label, { color: colors.muted }]}>Expenses</Text>
          <Text style={[styles.amount, { color: colors.ink }]} adjustsFontSizeToFit numberOfLines={1}>
            ₹{expense.toLocaleString('en-IN')}
          </Text>
        </View>
        
      </View>

      {/* Safe to Spend Banner (Insight style) */}
      {safeSpend > 0 && (
        <View style={[styles.insightBanner, { backgroundColor: isDark ? '#19191E' : '#F3E8FF' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: isDark ? '#FFFFFF' : colors.ink, fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
              Safe to spend today
            </Text>
          </View>
          <Text style={{ color: '#A855F7', fontSize: 15, fontWeight: '900', fontFamily: 'Outfit_700Bold' }}>
            ₹{safeSpend.toLocaleString('en-IN')} / day
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20, 
    padding: 12, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconWrapper: {
    width: 36,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 4,
    fontFamily: 'Inter_500Medium',
  },
  amount: {
    fontSize: 20, 
    fontWeight: '900', 
    fontVariant: ['tabular-nums'], 
    fontFamily: 'Outfit_700Bold',
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 100, // Pill shape
  }
});
