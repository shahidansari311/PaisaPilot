import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/Colors';

interface Props {
  colors: {
    danger: string;
    dangerGradient: readonly [string, string, ...string[]];
    success: string;
    successGradient: readonly [string, string, ...string[]];
  };
}

export function DashboardQuickAdd({ colors }: Props) {
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 16, marginBottom: 24 }}>
      <TouchableOpacity 
        onPress={() => router.push({ pathname: '/add-transaction', params: { prefillType: 'expense' } } as any)}
        activeOpacity={0.85} 
        style={{ flex: 1, shadowColor: colors.danger, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 }}
      >
        <LinearGradient
          colors={colors.dangerGradient}
          start={Gradients.horizontal.start}
          end={Gradients.horizontal.end}
          style={styles.button}
        >
          <Minus size={20} color="#fff" strokeWidth={3.5} />
          <Text style={styles.text}>Expense</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => router.push({ pathname: '/add-transaction', params: { prefillType: 'income' } } as any)}
        activeOpacity={0.85} 
        style={{ flex: 1, shadowColor: colors.success, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 }}
      >
        <LinearGradient
          colors={colors.successGradient}
          start={Gradients.horizontal.start}
          end={Gradients.horizontal.end}
          style={styles.button}
        >
          <Plus size={20} color="#fff" strokeWidth={3.5} />
          <Text style={styles.text}>Income</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 18, 
    borderRadius: 20,
  },
  text: {
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 16, 
    fontFamily: 'Outfit_700Bold',
  }
});
