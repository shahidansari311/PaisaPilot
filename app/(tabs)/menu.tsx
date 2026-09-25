import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal } from 'react-native';
import { Settings, Target, ChevronRight, User, CalendarDays, MessageSquare, CalendarClock } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function MenuScreen() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [userName, setUserName] = useState('');

  useFocusEffect(useCallback(() => {
    db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'user_name'")
      .then(row => { if (row?.value) setUserName(row.value); })
      .catch(console.error);
    loadSettings(db);
  }, []));

  const { monthStartDay, setMonthStartDay, loadSettings } = useSettingsStore();
  const [showDayPicker, setShowDayPicker] = useState(false);

  const theme = isDark ? Colors.dark : Colors.light;

  const menuItems = [
    { title: 'Monthly Budget', subtitle: 'Set budget & track spending', icon: <Target size={20} color={theme.primary} />, route: '/budget' },
    { title: 'Calendar', subtitle: 'See spending day by day', icon: <CalendarDays size={20} color={theme.primary} />, route: '/calendar' },
    { title: 'SMS Parser', subtitle: 'Paste SMS to auto-add transactions', icon: <MessageSquare size={20} color={theme.primary} />, route: '/sms-parser' },
    { title: 'Settings', subtitle: 'Theme, Export data & Preferences', icon: <Settings size={20} color={theme.primary} />, route: '/settings' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 56,
          paddingBottom: 20,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          marginBottom: 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 , fontFamily: 'FjallaOne_400Regular'}}>Menu</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 4 , fontFamily: 'FjallaOne_400Regular'}}>All your other stuff</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
        
        {/* User Profile Stub */}
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.primary , fontFamily: 'FjallaOne_400Regular'}}>
              {userName ? userName.charAt(0).toUpperCase() : <User size={22} color={theme.primary} />}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.ink , fontFamily: 'FjallaOne_400Regular'}}>{userName || 'Set Profile'}</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>Tap to set WhatsApp details</Text>
          </View>
          <ChevronRight size={18} color={theme.muted} />
        </TouchableOpacity>

        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 , fontFamily: 'FjallaOne_400Regular'}}>Features</Text>

        <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.title} 
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                {item.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.ink, marginBottom: 2 , fontFamily: 'FjallaOne_400Regular'}}>{item.title}</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={theme.muted} />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            onPress={() => setShowDayPicker(true)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <CalendarClock size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.ink, marginBottom: 2 , fontFamily: 'FjallaOne_400Regular'}}>Month Starts On</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>Currently set to {monthStartDay}{['st','nd','rd'][((monthStartDay+90)%100-10)%10-1]||'th'} of month</Text>
            </View>
            <ChevronRight size={18} color={theme.muted} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Day Picker Modal */}
      <Modal visible={showDayPicker} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, width: '100%', padding: 24, maxHeight: '80%' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.ink, marginBottom: 8, fontFamily: 'FjallaOne_400Regular' }}>Select Start Date</Text>
            <Text style={{ fontSize: 14, color: theme.muted, marginBottom: 20, fontFamily: 'FjallaOne_400Regular' }}>When do you get your salary or pocket money?</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingBottom: 20 }}>
              {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                <TouchableOpacity
                  key={day}
                  onPress={() => {
                    setMonthStartDay(db, day);
                    setShowDayPicker(false);
                  }}
                  style={{
                    width: 50, height: 50, borderRadius: 25,
                    backgroundColor: monthStartDay === day ? theme.primary : theme.surface,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: monthStartDay === day ? theme.primary : theme.border
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: monthStartDay === day ? '#fff' : theme.ink, fontFamily: 'FjallaOne_400Regular' }}>{day}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              onPress={() => setShowDayPicker(false)}
              style={{ padding: 16, alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, marginTop: 10 }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.ink, fontFamily: 'FjallaOne_400Regular' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
