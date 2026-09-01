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
  };
}

export function DashboardSummary({ income, expense, safeSpend, isDark, colors }: Props) {
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 14, marginBottom: 24 }}>
      
      {/* Income Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <LinearGradient
            colors={colors.successGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={styles.iconCircle}
          >
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
          <Text style={[styles.label, { color: colors.muted }]}>In</Text>
        </View>
        <Text style={[styles.amount, { color: colors.success }]} adjustsFontSizeToFit numberOfLines={1}>
          ₹{income.toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Expense Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <LinearGradient
            colors={colors.dangerGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={styles.iconCircle}
          >
            <TrendingDown size={16} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
          <Text style={[styles.label, { color: colors.muted }]}>Out</Text>
        </View>
        <Text style={[styles.amount, { color: colors.danger }]} adjustsFontSizeToFit numberOfLines={1}>
          ₹{expense.toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Safe to Spend Card */}
      {safeSpend > 0 && (
        <LinearGradient
          colors={colors.primaryGradient}
          start={Gradients.diagonal.start}
          end={Gradients.diagonal.end}
          style={[styles.card, { borderWidth: 0 }]}
        >
          <Text style={[styles.label, { color: 'rgba(255,255,255,0.8)', marginBottom: 12 }]}>Safe/day</Text>
          <Text style={[styles.amount, { color: '#ffffff' }]} adjustsFontSizeToFit numberOfLines={1}>
            ₹{safeSpend.toLocaleString('en-IN')}
          </Text>
        </LinearGradient>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, 
    borderRadius: 22, 
    padding: 16, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconCircle: {
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  label: {
    fontSize: 12, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    fontFamily: 'Outfit_700Bold',
  },
  amount: {
    fontSize: 22, 
    fontWeight: '900', 
    fontVariant: ['tabular-nums'], 
    fontFamily: 'Outfit_700Bold',
  },
});
