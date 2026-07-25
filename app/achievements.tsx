import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Trophy, Star, Target, Flame, Medal, Award } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback } from 'react';

type Badge = { id: string; title: string; description: string; icon: any; unlocked: boolean; color: string; };

export default function Achievements() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [badges, setBadges] = useState<Badge[]>([
    { id: '1', title: 'First Steps',   description: 'Logged your first transaction',       icon: Star,   unlocked: false, color: '#F59E0B' },
    { id: '2', title: 'Saver',         description: 'Expenses below income this month',    icon: Target, unlocked: false, color: '#10B981' },
    { id: '3', title: 'On Fire',       description: 'Logged 7+ transactions',              icon: Flame,  unlocked: false, color: '#F43F5E' },
    { id: '4', title: 'Split Master',  description: 'Created 3 split groups',              icon: Medal,  unlocked: false, color: '#6366F1' },
    { id: '5', title: 'CSV Pro',       description: 'Imported a bank statement',           icon: Award,  unlocked: false, color: '#8B5CF6' },
    { id: '6', title: 'Millionaire',   description: 'Reached ₹10,00,000 balance',          icon: Trophy, unlocked: false, color: '#EAB308' },
  ]);

  useFocusEffect(useCallback(() => { loadAchievements(); }, []));

  const loadAchievements = async () => {
    try {
      const b = [...badges];
      
      // First Steps & On Fire
      const txCountObj = await db.getFirstAsync<{c:number}>('SELECT COUNT(*) as c FROM transactions');
      const txCount = txCountObj?.c || 0;
      b[0].unlocked = txCount > 0;
      b[2].unlocked = txCount >= 7;

      // Saver
      const month = new Date().toISOString().substring(0, 7);
      const incObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='income' AND strftime('%Y-%m', date) = ?", [month]);
      const expObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='expense' AND strftime('%Y-%m', date) = ?", [month]);
      const inc = incObj?.t || 0;
      const exp = expObj?.t || 0;
      b[1].unlocked = (inc > 0 && exp < inc);

      // Split Master
      const groupCountObj = await db.getFirstAsync<{c:number}>('SELECT COUNT(*) as c FROM split_groups');
      b[3].unlocked = (groupCountObj?.c || 0) >= 3;

      // CSV Pro
      const csvObj = await db.getFirstAsync<{value:string}>("SELECT value FROM app_settings WHERE key = 'has_imported_csv'");
      b[4].unlocked = csvObj?.value === 'true';

      // Millionaire
      const totalIncObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='income'");
      const totalExpObj = await db.getFirstAsync<{t:number}>("SELECT SUM(amount) as t FROM transactions WHERE type='expense'");
      const bal = (totalIncObj?.t || 0) - (totalExpObj?.t || 0);
      b[5].unlocked = bal >= 1000000;

      setBadges(b);
    } catch (e) { console.error(e); }
  };

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const level = Math.floor(unlockedCount / 2) + 1;
  const xp = unlockedCount * 100;
  const maxXP = badges.length * 100;
  const rank = level === 1 ? 'Financial Noob' : level === 2 ? 'Budget Apprentice' : level === 3 ? 'Money Master' : 'Wealth Wizard';
  const xpPercent = Math.round((xp / maxXP) * 100);

  const bg    = isDark ? '#0D1117' : '#F4F3F0';
  const card  = isDark ? '#161B22' : '#FFFFFF';
  const raised = isDark ? '#1C2333' : '#F0EFEB';
  const border = isDark ? '#21262D' : '#E2E0DA';
  const ink   = isDark ? '#E6EDF3' : '#1A1A2E';
  const muted = '#6E7681';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Achievements</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Level card */}
        <View style={{ backgroundColor: card, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: border, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#FEF3C7', width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Trophy size={36} color="#F59E0B" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Level {level}</Text>
          <Text style={{ fontSize: 13, color: muted, marginTop: 4, marginBottom: 16 , fontFamily: 'DMSans_500Medium'}}>{rank}</Text>

          {/* XP Bar */}
          <View style={{ width: '100%', height: 8, backgroundColor: raised, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${xpPercent}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 11, color: muted, marginTop: 6, alignSelf: 'flex-end' , fontFamily: 'DMSans_500Medium'}}>{xp} / {maxXP} XP</Text>
        </View>

        <Text style={{ fontSize: 10, fontWeight: '600', color: muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 , fontFamily: 'DMSans_500Medium'}}>Your Badges</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {badges.map(badge => (
            <View key={badge.id} style={{
              width: '47%', backgroundColor: card, padding: 16, borderRadius: 14,
              borderWidth: 1, borderColor: badge.unlocked ? badge.color + '40' : border,
              alignItems: 'center', opacity: badge.unlocked ? 1 : 0.45,
            }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: badge.unlocked ? badge.color + '20' : raised }}>
                <badge.icon size={26} color={badge.unlocked ? badge.color : muted} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: ink, textAlign: 'center' , fontFamily: 'DMSans_700Bold'}}>{badge.title}</Text>
              <Text style={{ fontSize: 11, color: muted, textAlign: 'center', marginTop: 4, lineHeight: 16 , fontFamily: 'DMSans_500Medium'}}>{badge.description}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
