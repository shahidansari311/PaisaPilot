import { View, Text, TouchableOpacity } from 'react-native';
import { Cloud, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/Colors';

interface Props {
  roomsCount: number;
  colors: {
    card: string;
    border: string;
    ink: string;
    muted: string;
    primary: string;
    primaryGradient: readonly [string, string, ...string[]];
  };
}

export function DashboardSharedRooms({ roomsCount, colors }: Props) {
  if (roomsCount === 0) return null;

  return (
    <TouchableOpacity onPress={() => router.navigate('/(tabs)/split-groups')} activeOpacity={0.8}
      style={{ marginHorizontal: 20, marginBottom: 32, backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      <LinearGradient
        colors={colors.primaryGradient}
        start={Gradients.diagonal.start}
        end={Gradients.diagonal.end}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
      >
        <Cloud size={20} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 6, fontFamily: 'Outfit_700Bold' }}>Shared Rooms ☁️</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' }}>{roomsCount} active room{roomsCount > 1 ? 's' : ''} • Live synced</Text>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}
