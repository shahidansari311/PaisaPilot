import { View, Text, TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';

export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning ☀️';
  if (h >= 12 && h < 17) return 'Good Afternoon ⚡';
  if (h >= 17 && h < 22) return 'Good Evening 🌇';
  return 'Good Night 🌙';
}

interface Props {
  userName: string | null;
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    muted: string;
    ink: string;
    card: string;
    border: string;
  };
}

export function DashboardHeader({ userName, isDark, toggleTheme, colors }: Props) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}>
      <View>
        <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '700', marginBottom: 2, fontFamily: 'Inter_700Bold' }}>
          {getGreeting()} • {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, fontFamily: 'Outfit_700Bold' }}>
          {userName ? userName : 'PaisaPilot 💸'}
        </Text>
      </View>
      <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        {isDark ? <Sun size={22} color="#F59E0B" /> : <Moon size={22} color="#8B5CF6" />}
      </TouchableOpacity>
    </View>
  );
}
