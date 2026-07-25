import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, List, Repeat, Menu, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

export default function TabLayout() {
  const { isDark } = useThemeStore();

  const activeColor = isDark ? '#BB8A52' : '#0C3B2E'; // Gold in dark mode, Green in light
  const inactiveColor = isDark ? '#6D9773' : '#60716A';
  const bg = isDark ? '#173229' : '#FFFFFF';
  const indicatorColor = '#FFBA00';

  const renderIcon = (IconComponent: any, color: string, focused: boolean) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <IconComponent size={24} color={color} strokeWidth={2.5} />
      {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: indicatorColor, position: 'absolute', top: -6 }} />}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 20,
          right: 20,
          backgroundColor: bg,
          borderRadius: 24,
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 10 },
          height: 76,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => renderIcon(Home, color, focused) }} />
      <Tabs.Screen name="transactions" options={{ title: 'History', tabBarIcon: ({ color, focused }) => renderIcon(List, color, focused) }} />
      <Tabs.Screen name="borrow-lend" options={{ title: 'Debt', tabBarIcon: ({ color, focused }) => renderIcon(Repeat, color, focused) }} />
      <Tabs.Screen name="split-groups" options={{ title: 'Split', tabBarIcon: ({ color, focused }) => renderIcon(Users, color, focused) }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: ({ color, focused }) => renderIcon(Menu, color, focused) }} />
      
      {/* Hidden Tabs - Accessed via Menu */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
    </Tabs>
  );
}
