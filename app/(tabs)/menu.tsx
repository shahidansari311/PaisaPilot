import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { PieChart, Settings, Target, ChevronRight, User, CalendarDays, MessageSquare } from 'lucide-react-native';

export default function MenuScreen() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [userName, setUserName] = useState('');

  useFocusEffect(useCallback(() => {
    db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'user_name'")
      .then(row => { if (row?.value) setUserName(row.value); })
      .catch(console.error);
  }, []));

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const primary = '#8B5CF6';

  const menuItems = [
    { title: 'Monthly Budget', subtitle: 'Set budget & track spending', icon: <Target size={24} color={primary} />, route: '/budget' },
    { title: 'Calendar', subtitle: 'See spending day by day', icon: <CalendarDays size={24} color={primary} />, route: '/calendar' },
    { title: 'SMS Parser', subtitle: 'Paste SMS to auto-add transactions', icon: <MessageSquare size={24} color={primary} />, route: '/sms-parser' },
    { title: 'Settings', subtitle: 'Theme, Export data & Preferences', icon: <Settings size={24} color={primary} />, route: '/settings' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24, backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: border }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: ink, letterSpacing: -1 , fontFamily: 'CormorantGaramond_700Bold'}}>Menu 🍔</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>All your other stuff</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* User Profile Stub */}
        <TouchableOpacity 
          onPress={() => router.navigate('/profile')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: border, marginBottom: 32, shadowColor: ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: primary , fontFamily: 'CormorantGaramond_700Bold'}}>
              {userName ? userName.charAt(0).toUpperCase() : <User size={32} color={primary} />}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>{userName || 'Set Profile'}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>Tap to set WhatsApp details</Text>
          </View>
          <ChevronRight size={24} color={muted} />
        </TouchableOpacity>

        <Text style={{ fontSize: 14, fontWeight: '800', color: muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 , fontFamily: 'CormorantGaramond_700Bold'}}>Features</Text>

        <View style={{ backgroundColor: card, borderRadius: 24, borderWidth: 1, borderColor: border, overflow: 'hidden', shadowColor: ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.title} 
              onPress={() => router.navigate(item.route as any)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: index === menuItems.length - 1 ? 0 : 1, borderBottomColor: border }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                {item.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: ink, marginBottom: 4 , fontFamily: 'CormorantGaramond_700Bold'}}>{item.title}</Text>
                <Text style={{ fontSize: 13, fontWeight: '500', color: muted , fontFamily: 'DMSans_500Medium'}}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={24} color={muted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
