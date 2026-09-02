import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Moon, Sun, Bell, ChevronDown, User, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Gradients } from '../../constants/Colors';

export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 22) return 'Evening';
  return 'Night';
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
  totalBalance: number;
  currentDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  isCurrentMonth: boolean;
}

export function DashboardHeader({ userName, isDark, toggleTheme, colors, totalBalance, currentDate, prevMonth, nextMonth, isCurrentMonth }: Props) {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#A855F7', '#7C3AED']} // Vibrant purple gradient similar to image
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: 46,
        paddingBottom: 32,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        marginBottom: -20, // Allows next content to overlap slightly or sit tight
      }}
    >
      {/* Top Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        {/* Profile */}
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
        >
          <User size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Date Selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 4 }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 }}>
            <ChevronLeft size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={{ marginHorizontal: 8, fontSize: 12, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Outfit_700Bold', minWidth: 60, textAlign: 'center' }}>
            {currentDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
          </Text>
          
          <TouchableOpacity onPress={nextMonth} disabled={isCurrentMonth} style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, opacity: isCurrentMonth ? 0.3 : 1 }}>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Theme/Notification */}
        <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          {isDark ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      {/* Balance Area */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 8, fontFamily: 'Inter_500Medium' }}>
          Current Balance
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -1, fontFamily: 'Outfit_700Bold', fontVariant: ['tabular-nums'] }}>
          ₹{totalBalance.toLocaleString('en-IN')}
        </Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
            {getGreeting()}, {userName || 'Pilot'} 👋
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
