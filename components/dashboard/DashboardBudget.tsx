import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/Colors';

interface Props {
  budgetAmount: number;
  expense: number;
  remaining: number;
  isOverBudget: boolean;
  pct: number;
  progressColor: string;
  progressGradient: readonly [string, string, ...string[]];
  colors: {
    card: string;
    border: string;
    muted: string;
    ink: string;
    raised: string;
    danger: string;
  };
}

export function DashboardBudget({ budgetAmount, expense, remaining, isOverBudget, pct, progressColor, progressGradient, colors }: Props) {
  return (
    <TouchableOpacity 
      onPress={() => router.navigate('/budget' as any)} 
      activeOpacity={0.85}
      style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
    >
      <LinearGradient 
        colors={progressGradient} 
        start={Gradients.horizontal.start} 
        end={Gradients.horizontal.end} 
        style={{ height: 4 }} 
      />
      <View style={{ padding: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Outfit_700Bold' }}>This Month's Budget</Text>
            {budgetAmount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 36, fontWeight: '900', color: colors.ink, fontVariant: ['tabular-nums'], fontFamily: 'Outfit_700Bold' }}>
                  ₹{Math.abs(remaining).toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.muted, fontFamily: 'Inter_700Bold' }}>
                  {isOverBudget ? 'over 😬' : 'left 🎯'}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.muted, marginTop: 4, fontFamily: 'Inter_700Bold' }}>No budget set</Text>
            )}
          </View>
          <View style={{ backgroundColor: progressColor + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: progressColor, fontFamily: 'Outfit_700Bold' }}>
              {budgetAmount > 0 ? `${Math.round(pct * 100)}%` : 'Set it →'}
            </Text>
          </View>
        </View>

        {budgetAmount > 0 && (
          <>
            <View style={{ height: 12, backgroundColor: colors.raised, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
              <LinearGradient 
                colors={progressGradient} 
                start={Gradients.horizontal.start} 
                end={Gradients.horizontal.end} 
                style={{ height: 12, borderRadius: 6, width: `${Math.min(100, pct * 100)}%` }} 
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger, fontVariant: ['tabular-nums'], fontFamily: 'Inter_600SemiBold' }}>
                −₹{expense.toLocaleString('en-IN')} spent
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted, fontFamily: 'Inter_700Bold' }}>of ₹{budgetAmount.toLocaleString('en-IN')}</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
