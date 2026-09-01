import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, List, Repeat, Menu, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

export default function TabLayout() {
  const { isDark } = useThemeStore();

  const bg = isDark ? '#121212' : '#EBF1ED';
  const card = isDark ? '#2D2E2B' : '#FFFFFF';
  const raised = isDark ? '#50605A' : '#EBF1ED';
  const border = isDark ? '#50605A' : '#B9CABE';
  const ink = isDark ? '#EBF1ED' : '#121212';
  const muted = isDark ? '#B9CABE' : '#81938A';
  const primary = isDark ? '#81938A' : '#50605A';
  const secondary = isDark ? '#50605A' : '#81938A';
  const accent = '#50605A';
  const highlight = '#FFBA00';
  const success = '#3A8F5A';
  const danger = '#C44D4D';
  const warning = '#D89B00';

  const activeColor = primary;
  const inactiveColor = muted;

  const renderIcon = (IconComponent: any, color: string, focused: boolean) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <IconComponent size={24} color={color} strokeWidth={2.5} />
      {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: highlight, position: 'absolute', top: -6 }} />}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: card,
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
