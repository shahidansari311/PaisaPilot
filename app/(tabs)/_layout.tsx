import { Tabs } from 'expo-router';
import { Home, List, Repeat, Menu, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

export default function TabLayout() {
  const { isDark } = useThemeStore();

  const activeColor = '#8B5CF6'; // Primary Purple
  const inactiveColor = isDark ? '#64748B' : '#94A3B8';
  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          elevation: 20,
          shadowOpacity: 0.1,
          shadowRadius: 20,
          height: 84,
          paddingBottom: 24,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="transactions" options={{ title: 'History', tabBarIcon: ({ color }) => <List size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="borrow-lend" options={{ title: 'Debt', tabBarIcon: ({ color }) => <Repeat size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="split-groups" options={{ title: 'Split', tabBarIcon: ({ color }) => <Users size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: ({ color }) => <Menu size={24} color={color} strokeWidth={2.5} /> }} />
      
      {/* Hidden Tabs - Accessed via Menu */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
    </Tabs>
  );
}
