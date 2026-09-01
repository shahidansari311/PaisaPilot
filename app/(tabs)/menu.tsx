import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { PieChart, Settings, Target, ChevronRight, User, CalendarDays, MessageSquare } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function MenuScreen() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [userName, setUserName] = useState('');

  useFocusEffect(useCallback(() => {
    db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'user_name'")
      .then(row => { if (row?.value) setUserName(row.value); })
      .catch(console.error);
  }, []));

  const theme = isDark ? Colors.dark : Colors.light;

  const menuItems = [
    { title: 'Monthly Budget', subtitle: 'Set budget & track spending', icon: <Target size={24} color={theme.primary} />, route: '/budget' },
    { title: 'Calendar', subtitle: 'See spending day by day', icon: <CalendarDays size={24} color={theme.primary} />, route: '/calendar' },
    { title: 'SMS Parser', subtitle: 'Paste SMS to auto-add transactions', icon: <MessageSquare size={24} color={theme.primary} />, route: '/sms-parser' },
    { title: 'Settings', subtitle: 'Theme, Export data & Preferences', icon: <Settings size={24} color={theme.primary} />, route: '/settings' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: theme.ink, letterSpacing: -1 , fontFamily: 'Outfit_700Bold'}}>Menu 🍔</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, marginTop: 4 , fontFamily: 'Inter_500Medium'}}>All your other stuff</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* User Profile Stub */}
        <TouchableOpacity 
          onPress={() => router.navigate('/profile')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.border, marginBottom: 32, shadowColor: theme.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: theme.primary , fontFamily: 'Outfit_700Bold'}}>
              {userName ? userName.charAt(0).toUpperCase() : <User size={32} color={theme.primary} />}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>{userName || 'Set Profile'}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted , fontFamily: 'Inter_500Medium'}}>Tap to set WhatsApp details</Text>
          </View>
          <ChevronRight size={24} color={theme.muted} />
        </TouchableOpacity>

        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 , fontFamily: 'Outfit_700Bold'}}>Features</Text>

        <View style={{ backgroundColor: theme.card, borderRadius: 24, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', shadowColor: theme.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.title} 
              onPress={() => router.navigate(item.route as any)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: index === menuItems.length - 1 ? 0 : 1, borderBottomColor: theme.border }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                {item.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 4 , fontFamily: 'Outfit_700Bold'}}>{item.title}</Text>
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.muted , fontFamily: 'Inter_500Medium'}}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={24} color={theme.muted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
