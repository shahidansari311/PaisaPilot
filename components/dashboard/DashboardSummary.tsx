import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface Props {
  income: number;
  expense: number;
  safeSpend: number;
  todayExpense?: number;
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

export function DashboardSummary({ income, expense, safeSpend, todayExpense = 0, isDark, colors }: Props) {
  const isOverLimit = todayExpense > safeSpend && safeSpend > 0;
  const overAmount = todayExpense - safeSpend;
  const leftToday = Math.max(0, safeSpend - todayExpense);

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      
      {/* Section Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink, fontFamily: 'FjallaOne_400Regular' }}>Your Money</Text>
      </View>

      {/* Income & Expense Cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        
        {/* Income Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1, padding: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <TrendingUp size={14} color={colors.success} strokeWidth={2.5} />
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>Income</Text>
          </View>
          <Text style={[styles.amount, { color: colors.ink, fontSize: 16 }]} adjustsFontSizeToFit numberOfLines={1}>
            ₹{income.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Expense Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1, padding: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
              <TrendingDown size={14} color={colors.danger} strokeWidth={2.5} />
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>Expenses</Text>
          </View>
          <Text style={[styles.amount, { color: colors.ink, fontSize: 16 }]} adjustsFontSizeToFit numberOfLines={1}>
            ₹{expense.toLocaleString('en-IN')}
          </Text>
        </View>
        
      </View>

      {/* Safe to Spend Banner (Insight style) */}
      {safeSpend > 0 && !isOverLimit && (
        <View style={[styles.insightBanner, { backgroundColor: isDark ? '#19191E' : colors.primaryGradient[0] + '15' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14 }}>✨</Text>
            <Text style={{ color: isDark ? '#FFFFFF' : colors.ink, fontSize: 12, fontWeight: '700', fontFamily: 'FjallaOne_400Regular' }}>
              Safe to spend today
            </Text>
          </View>
          <Text style={{ color: '#A855F7', fontSize: 14, fontWeight: '900', fontFamily: 'FjallaOne_400Regular' }}>
            ₹{leftToday.toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      {isOverLimit && (
        <View style={[styles.insightBanner, { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.1)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700', fontFamily: 'FjallaOne_400Regular' }}>
              Over today's limit
            </Text>
          </View>
          <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '900', fontFamily: 'FjallaOne_400Regular' }}>
            -₹{overAmount.toLocaleString('en-IN')}
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11, 
    fontWeight: '600', 
    fontFamily: 'FjallaOne_400Regular',
  },
  amount: {
    fontSize: 16, 
    fontWeight: '900', 
    fontVariant: ['tabular-nums'], 
    fontFamily: 'FjallaOne_400Regular',
    paddingLeft: 6,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100, // Pill shape
  }
});
