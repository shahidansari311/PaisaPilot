import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ArrowLeft, User, Phone, Check, Save, Trophy, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [levelData, setLevelData] = useState({ level: 1, rank: 'Financial Noob' });

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const raised = isDark ? '#334155' : '#F1F5F9';
  const border = isDark ? '#334155' : '#E2E8F0';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const primary = '#8B5CF6';
  const success = '#10B981';

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, []));

  const loadProfile = async () => {
    try {
      const nameRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_name'`);
      const phoneRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_phone'`);
      if (nameRow?.value) setName(nameRow.value);
      if (phoneRow?.value) setPhone(phoneRow.value);

      // Achievements calculation
      let unlockedCount = 0;
      const txCountObj = await db.getFirstAsync<{c:number}>('SELECT COUNT(*) as c FROM transactions');
      const txCount = txCountObj?.c || 0;
      if (txCount > 0) unlockedCount++;
      if (txCount >= 7) unlockedCount++;

      const month = new Date().toISOString().substring(0, 7);
      const incObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='income' AND strftime('%Y-%m', date) = ?", [month]);
      const expObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='expense' AND strftime('%Y-%m', date) = ?", [month]);
      const inc = incObj?.t || 0;
      const exp = expObj?.t || 0;
      if (inc > 0 && exp < inc) unlockedCount++;

      const groupCountObj = await db.getFirstAsync<{c:number}>('SELECT COUNT(*) as c FROM split_groups');
      if ((groupCountObj?.c || 0) >= 3) unlockedCount++;

      const csvObj = await db.getFirstAsync<{value:string}>("SELECT value FROM app_settings WHERE key = 'has_imported_csv'");
      if (csvObj?.value === 'true') unlockedCount++;

      const totalIncObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='income'");
      const totalExpObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='expense'");
      const bal = (totalIncObj?.t || 0) - (totalExpObj?.t || 0);
      if (bal >= 1000000) unlockedCount++;

      const level = Math.floor(unlockedCount / 2) + 1;
      const rank = level === 1 ? 'Financial Noob' : level === 2 ? 'Budget Apprentice' : level === 3 ? 'Money Master' : 'Wealth Wizard';
      setLevelData({ level, rank });
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
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ backgroundColor: raised, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>My Profile 👤</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
            <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff' , fontFamily: 'CormorantGaramond_700Bold'}}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>{name || 'Your Name'}</Text>
          {phone ? <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>+91 {phone}</Text> : null}
        </View>

        {/* Info Banner */}
        <View style={{ backgroundColor: primary + '15', borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: primary + '30' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: primary, lineHeight: 22 , fontFamily: 'DMSans_700Bold'}}>
            💡 Your name appears on WhatsApp reminders sent to people who owe you money. Your phone number is used to identify your WhatsApp account.
          </Text>
        </View>

        {/* Achievements */}
        <TouchableOpacity onPress={() => router.push('/achievements')} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#F59E0B' + '40', shadowColor: '#F59E0B', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B' + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Trophy size={24} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Level {levelData.level}: {levelData.rank}</Text>
            <Text style={{ fontSize: 13, color: muted, marginTop: 2, fontWeight: '600' , fontFamily: 'DMSans_500Medium'}}>Tap to view all badges</Text>
          </View>
          <ChevronRight size={20} color={muted} />
        </TouchableOpacity>

        {/* Name Input */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 , fontFamily: 'CormorantGaramond_700Bold'}}>Your Name</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, borderRadius: 18, borderWidth: 1, borderColor: border, paddingHorizontal: 16 }}>
            <User size={18} color={muted} style={{ marginRight: 12 }} />
            <TextInput
              style={{ flex: 1, paddingVertical: 16, color: ink, fontSize: 17, fontWeight: '600' }}
              placeholder="e.g. Rahul Verma"
              placeholderTextColor={muted}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Phone Input */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 , fontFamily: 'CormorantGaramond_700Bold'}}>Your WhatsApp Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, borderRadius: 18, borderWidth: 1, borderColor: border, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: muted, marginRight: 8 , fontFamily: 'DMSans_700Bold'}}>+91</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 16, color: ink, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}
              placeholder="9876543210"
              placeholderTextColor={muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            />
          </View>
          <Text style={{ fontSize: 12, color: muted, marginTop: 8, fontWeight: '500' , fontFamily: 'DMSans_500Medium'}}>
            This is used to auto-open WhatsApp reminders from your account.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 22, backgroundColor: saved ? success : primary, shadowColor: saved ? success : primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
          {saved ? <Check size={22} color="#fff" strokeWidth={3} /> : <Save size={22} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 , fontFamily: 'CormorantGaramond_700Bold'}}>{saved ? 'Saved! ✅' : 'Save Profile'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
