import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useState } from 'react';
import { router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { ArrowLeft, Users, Check, Hash } from 'lucide-react-native';
import { supabase } from '../config/supabaseConfig';
import { useLiveSplitStore } from '../store/useLiveSplitStore';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function JoinLiveGroup() {
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;
  const { addGroup } = useLiveSplitStore();
  
  const [mode, setMode] = useState<'create'|'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [myName, setMyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!groupName.trim() || !myName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const code = generateCode();
      // Insert Group
      const { error: groupErr } = await supabase.from('live_split_groups').insert({
        id: code,
        name: groupName.trim(),
        created_by: myName.trim()
      });
      if (groupErr) throw groupErr;

      // Insert Member
      const { data: memberData, error: memberErr } = await supabase.from('live_split_members').insert({
        group_id: code,
        name: myName.trim()
      }).select('id').single();
      
      if (memberErr || !memberData) throw memberErr || new Error('Failed to create member');

      await addGroup({
        groupId: code,
        myMemberId: memberData.id,
        myName: myName.trim(),
        groupName: groupName.trim(),
        joinedAt: new Date().toISOString()
      });

      router.replace({ pathname: '/live-group/[id]', params: { id: code } } as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to create live group. ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || !myName.trim()) {
      Alert.alert('Error', 'Please enter a valid code and your name');
      return;
    }
    setLoading(true);
    try {
      // Check if group exists
      const { data: groupData, error: groupErr } = await supabase.from('live_split_groups').select('*').eq('id', code).single();
      if (groupErr || !groupData) throw new Error('Group not found');

      // Insert Member
      const { data: memberData, error: memberErr } = await supabase.from('live_split_members').insert({
        group_id: code,
        name: myName.trim()
      }).select('id').single();
      
      if (memberErr || !memberData) throw memberErr || new Error('Failed to join');

      await addGroup({
        groupId: code,
        myMemberId: memberData.id,
        myName: myName.trim(),
        groupName: groupData.name,
        joinedAt: new Date().toISOString()
      });

      router.replace({ pathname: '/live-group/[id]', params: { id: code } } as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 16 }}>
          <ArrowLeft size={24} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.ink, fontFamily: 'FjallaOne_400Regular' }}>Live Split Group</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        
        {/* Toggle Mode */}
        <View style={{ flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
          <TouchableOpacity onPress={() => setMode('create')} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: mode === 'create' ? theme.card : 'transparent', borderRadius: 12, shadowColor: theme.ink, shadowOpacity: mode === 'create' ? 0.05 : 0, shadowRadius: 4, elevation: mode === 'create' ? 2 : 0 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: mode === 'create' ? theme.primary : theme.muted, fontFamily: 'FjallaOne_400Regular' }}>Create New</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('join')} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: mode === 'join' ? theme.card : 'transparent', borderRadius: 12, shadowColor: theme.ink, shadowOpacity: mode === 'join' ? 0.05 : 0, shadowRadius: 4, elevation: mode === 'join' ? 2 : 0 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: mode === 'join' ? theme.primary : theme.muted, fontFamily: 'FjallaOne_400Regular' }}>Join Existing</Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Users size={24} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 6, fontFamily: 'FjallaOne_400Regular' }}>Create a Live Group</Text>
            <Text style={{ fontSize: 13, color: theme.muted, marginBottom: 20, lineHeight: 18, fontFamily: 'FjallaOne_400Regular' }}>Create a group that syncs over the cloud so everyone can add their own expenses.</Text>

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.ink, marginBottom: 8, letterSpacing: 0.5, fontFamily: 'FjallaOne_400Regular' }}>GROUP NAME</Text>
            <TextInput
              style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 16, fontFamily: 'FjallaOne_400Regular' }}
              placeholder="e.g. Goa Trip"
              placeholderTextColor={theme.muted + '80'}
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.ink, marginBottom: 8, letterSpacing: 0.5, fontFamily: 'FjallaOne_400Regular' }}>YOUR NAME</Text>
            <TextInput
              style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 24, fontFamily: 'FjallaOne_400Regular' }}
              placeholder="e.g. Rahul"
              placeholderTextColor={theme.muted + '80'}
              value={myName}
              onChangeText={setMyName}
            />

            <TouchableOpacity onPress={handleCreate} disabled={loading} activeOpacity={0.8} style={{ borderRadius: 16, overflow: 'hidden' }}>
              <LinearGradient colors={theme.primaryGradient} start={Gradients.diagonal.start} end={Gradients.diagonal.end} style={{ padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Check size={20} color="#fff" strokeWidth={3} /><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'FjallaOne_400Regular' }}>Create Group</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Hash size={24} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 6, fontFamily: 'FjallaOne_400Regular' }}>Join with Code</Text>
            <Text style={{ fontSize: 13, color: theme.muted, marginBottom: 20, lineHeight: 18, fontFamily: 'FjallaOne_400Regular' }}>Ask your friend for the 6-character room code.</Text>

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.ink, marginBottom: 8, letterSpacing: 0.5, fontFamily: 'FjallaOne_400Regular' }}>ROOM CODE</Text>
            <TextInput
              style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 14, color: theme.ink, fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase', fontFamily: 'FjallaOne_400Regular' }}
              placeholder="XYZ123"
              placeholderTextColor={theme.muted + '50'}
              autoCapitalize="characters"
              maxLength={6}
              value={joinCode}
              onChangeText={setJoinCode}
            />

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.ink, marginBottom: 8, letterSpacing: 0.5, fontFamily: 'FjallaOne_400Regular' }}>YOUR NAME</Text>
            <TextInput
              style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 24, fontFamily: 'FjallaOne_400Regular' }}
              placeholder="e.g. Rahul"
              placeholderTextColor={theme.muted + '80'}
              value={myName}
              onChangeText={setMyName}
            />

            <TouchableOpacity onPress={handleJoin} disabled={loading} activeOpacity={0.8} style={{ borderRadius: 16, overflow: 'hidden' }}>
              <LinearGradient colors={theme.primaryGradient} start={Gradients.diagonal.start} end={Gradients.diagonal.end} style={{ padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Check size={20} color="#fff" strokeWidth={3} /><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'FjallaOne_400Regular' }}>Join Group</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
