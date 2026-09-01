import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/Colors';

interface Props {
  levelData: { level: number; rank: string };
  colors: {
    card: string;
    ink: string;
    muted: string;
    warningGradient: readonly [string, string, ...string[]];
    border: string;
  };
}

export function DashboardAchievements({ levelData, colors }: Props) {
  return (
    <TouchableOpacity 
      onPress={() => router.push('/achievements')} 
      activeOpacity={0.8}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <LinearGradient
        colors={colors.warningGradient}
        start={Gradients.diagonal.start}
        end={Gradients.diagonal.end}
        style={styles.iconContainer}
      >
        <Trophy size={22} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
      
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.ink }]}>
          Level {levelData.level}: {levelData.rank}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Tap to view all badges
        </Text>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 24, 
    padding: 16, 
    marginHorizontal: 20, 
    marginBottom: 24, 
    borderWidth: 1, 
    shadowColor: '#F59E0B', 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconContainer: {
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16,
  },
  title: {
    fontSize: 17, 
    fontWeight: '800', 
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 13, 
    marginTop: 2, 
    fontWeight: '600', 
    fontFamily: 'Inter_500Medium',
  },
});
