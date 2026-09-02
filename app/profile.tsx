import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ backgroundColor: theme.surface, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ArrowLeft size={18} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'Outfit_700Bold'}}>My Profile 👤</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: theme.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' , fontFamily: 'Outfit_700Bold'}}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>{name || 'Your Name'}</Text>
          {phone ? <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, marginTop: 4 , fontFamily: 'Inter_500Medium'}}>+91 {phone}</Text> : null}
        </View>

        {/* Info Banner */}
        <View style={{ backgroundColor: theme.primary + '15', borderRadius: 16, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: theme.primary + '30' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary, lineHeight: 20 , fontFamily: 'Inter_700Bold'}}>
            💡 Your name appears on WhatsApp reminders sent to people who owe you money. Your phone number is used to identify your WhatsApp account.
          </Text>
        </View>

        {/* Name Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>Your Name</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
            <User size={16} color={theme.muted} style={{ marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, paddingVertical: 12, color: theme.ink, fontSize: 14, fontWeight: '600' }}
              placeholder="e.g. Rahul Verma"
              placeholderTextColor={theme.muted}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Phone Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>Your WhatsApp Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.muted, marginRight: 8 , fontFamily: 'Inter_700Bold'}}>+91</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 12, color: theme.ink, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] }}
              placeholder="9876543210"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            />
          </View>
          <Text style={{ fontSize: 11, color: theme.muted, marginTop: 8, fontWeight: '500' , fontFamily: 'Inter_500Medium'}}>
            This is used to auto-open WhatsApp reminders from your account.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}
          style={{ borderRadius: 16, overflow: 'hidden' }}>
          <LinearGradient
            colors={saved ? [theme.success, theme.success] : theme.primaryGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 }}
          >
            {saved ? <Check size={18} color="#fff" strokeWidth={3} /> : <Save size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 , fontFamily: 'Outfit_700Bold'}}>{saved ? 'Saved! ✅' : 'Save Profile'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
