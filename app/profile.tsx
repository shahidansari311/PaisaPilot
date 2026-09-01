import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ArrowLeft, User, Phone, Check, Save, Trophy, ChevronRight } from 'lucide-react-native';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const theme = isDark ? Colors.dark : Colors.light;
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, []));

  const loadProfile = async () => {
    try {
      const nameRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_name'`);
      const phoneRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_phone'`);
      if (nameRow?.value) setName(nameRow.value);
      if (phoneRow?.value) setPhone(phoneRow.value);
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Oops!', 'Please enter your name.'); return; }
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('user_name', ?)`, [name.trim()]
      );
      const cleanPhone = phone.replace(/\D/g, '');
      await db.runAsync(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('user_phone', ?)`, [cleanPhone]
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      Alert.alert('Oops!', 'Something went wrong while saving your profile.');
    }
  };

  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ backgroundColor: theme.surface, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <ArrowLeft size={22} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'Outfit_700Bold'}}>My Profile 👤</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: theme.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
            <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff' , fontFamily: 'Outfit_700Bold'}}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>{name || 'Your Name'}</Text>
          {phone ? <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, marginTop: 4 , fontFamily: 'Inter_500Medium'}}>+91 {phone}</Text> : null}
        </View>

        {/* Info Banner */}
        <View style={{ backgroundColor: theme.primary + '15', borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.primary + '30' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.primary, lineHeight: 22 , fontFamily: 'Inter_700Bold'}}>
            💡 Your name appears on WhatsApp reminders sent to people who owe you money. Your phone number is used to identify your WhatsApp account.
          </Text>
        </View>

        {/* Name Input */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 , fontFamily: 'Outfit_700Bold'}}>Your Name</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16 }}>
            <User size={18} color={theme.muted} style={{ marginRight: 12 }} />
            <TextInput
              style={{ flex: 1, paddingVertical: 16, color: theme.ink, fontSize: 17, fontWeight: '600' }}
              placeholder="e.g. Rahul Verma"
              placeholderTextColor={theme.muted}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Phone Input */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 , fontFamily: 'Outfit_700Bold'}}>Your WhatsApp Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.muted, marginRight: 8 , fontFamily: 'Inter_700Bold'}}>+91</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 16, color: theme.ink, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}
              placeholder="9876543210"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            />
          </View>
          <Text style={{ fontSize: 12, color: theme.muted, marginTop: 8, fontWeight: '500' , fontFamily: 'Inter_500Medium'}}>
            This is used to auto-open WhatsApp reminders from your account.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}
          style={{ borderRadius: 22, overflow: 'hidden' }}>
          <LinearGradient
            colors={saved ? [theme.success, theme.success] : theme.primaryGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 }}
          >
            {saved ? <Check size={22} color="#fff" strokeWidth={3} /> : <Save size={22} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 , fontFamily: 'Outfit_700Bold'}}>{saved ? 'Saved! ✅' : 'Save Profile'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
