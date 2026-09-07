  import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Share, KeyboardAvoidingView, Platform } from 'react-native';
  import { CustomAlert as Alert } from '../utils/alert';
  import { router } from 'expo-router';
  import { useThemeStore } from '../store/useThemeStore';
  import { useSharedRoomStore } from '../store/useSharedRoomStore';
  import { useState } from 'react';
  import { Shuffle, Cloud, Sparkles, ArrowLeft, Plus, LogIn, Share2 as ShareIcon } from 'lucide-react-native';
  import { supabase } from '../config/supabaseConfig';
  import { Colors, Gradients } from '../constants/Colors';
  import { LinearGradient } from 'expo-linear-gradient';

  function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/1/O/0 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  export default function JoinSharedRoom() {
    const isDark = useThemeStore((state) => state.isDark);
    const theme = isDark ? Colors.dark : Colors.light;
    const { addRoom } = useSharedRoomStore();

    const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
    const [displayName, setDisplayName] = useState('');
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);

    const handleCreate = async () => {
      if (!displayName.trim()) { Alert.alert('Oops', 'Enter your display name'); return; }
      if (!roomName.trim()) { Alert.alert('Oops', 'Give your shared room a name'); return; }

      const code = roomCode.trim().toUpperCase() || generateCode();

      setLoading(true);
      try {
        // Check if code already exists in Supabase
        const { data: existingRoom } = await supabase
          .from('shared_rooms')
          .select('code')
          .eq('code', code)
          .single();

        if (existingRoom) {
          Alert.alert('Code Taken', `The code "${code}" is already in use. Try a different one or generate a random code.`);
          setLoading(false);
          return;
        }

        const memberId = `member_${Date.now()}`;
        const now = new Date().toISOString();

        // Create room in Supabase
        const { error: roomError } = await supabase
          .from('shared_rooms')
          .insert({
            code: code,
            room_name: roomName.trim(),
            created_by: displayName.trim(),
            created_at: now
          });

        if (roomError) throw roomError;

        // Add creator as member
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            id: memberId,
            room_code: code,
            name: displayName.trim(),
            joined_at: now
          });

        if (memberError) throw memberError;

        // Save locally
        await addRoom({
          roomCode: code,
          myMemberId: memberId,
          myName: displayName.trim(),
          roomName: roomName.trim(),
          joinedAt: now,
        });

        setCreatedCode(code);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to create room. Check your internet connection.');
      }
      setLoading(false);
    };

    const handleJoin = async () => {
      if (!displayName.trim()) { Alert.alert('Oops', 'Enter your display name'); return; }
      if (!roomCode.trim()) { Alert.alert('Oops', 'Enter the room code'); return; }

      const code = roomCode.trim().toUpperCase();

      setLoading(true);
      try {
        const { data: roomData, error: findError } = await supabase
          .from('shared_rooms')
          .select('*')
          .eq('code', code)
          .single();

        if (findError || !roomData) {
          Alert.alert('Not Found', `No room found with code "${code}". Double-check the code.`);
          setLoading(false);
          return;
        }

        const memberId = `member_${Date.now()}`;
        const now = new Date().toISOString();

        // Add self as member in Supabase
        const { error: joinError } = await supabase
          .from('room_members')
          .insert({
            id: memberId,
            room_code: code,
            name: displayName.trim(),
            joined_at: now
          });

        if (joinError) throw joinError;

        // Save locally
        await addRoom({
          roomCode: code,
          myMemberId: memberId,
          myName: displayName.trim(),
          roomName: roomData.room_name || 'Shared Room',
          joinedAt: now,
        });

        router.replace({ pathname: '/shared-room', params: { code } } as any);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to join room. Check your internet connection.');
      }
      setLoading(false);
    };

    const shareCode = async () => {
      if (!createdCode) return;
      try {
        await Share.share({
          message: `🏠 Join my shared expense room on PaisaPilot!\n\nRoom: ${roomName}\nCode: ${createdCode}\n\nDownload PaisaPilot and enter this code to start tracking our shared expenses!`,
        });
      } catch {}
    };

    const goToRoom = () => {
      if (createdCode) {
        router.replace({ pathname: '/shared-room', params: { code: createdCode } } as any);
      }
    };

    // ── Success Screen after creating ──
    if (createdCode) {
      return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
              <ArrowLeft size={22} color={theme.ink} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink , fontFamily: 'FjallaOne_400Regular'}}>Room Created!</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', paddingTop: 48 }}>
            <View style={{ backgroundColor: theme.primary + '15', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Sparkles size={40} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.ink, textAlign: 'center', marginBottom: 8 , fontFamily: 'FjallaOne_400Regular'}}>
              Your room is ready!
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, textAlign: 'center', marginBottom: 32, lineHeight: 22 , fontFamily: 'FjallaOne_400Regular'}}>
              Share this code with your roommate so they can join and start adding expenses together.
            </Text>

            {/* Code Display */}
            <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 24, borderWidth: 2, borderColor: theme.primary + '40', marginBottom: 24, width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 , fontFamily: 'FjallaOne_400Regular'}}>Room Code</Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: theme.primary, letterSpacing: 8, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>
                {createdCode}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, marginTop: 8 , fontFamily: 'FjallaOne_400Regular'}}>{roomName}</Text>
            </View>

            {/* Actions */}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={shareCode}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 14,
                  borderRadius: 20,
                  backgroundColor: '#25D36615',
                  borderWidth: 1,
                  borderColor: '#25D36630',
                }}>
                <ShareIcon size={16} color="#25D366" />
                <Text style={{ fontWeight: '800', fontSize: 14, color: '#25D366' , fontFamily: 'FjallaOne_400Regular'}}>
                  Share Room Code
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goToRoom} activeOpacity={0.85}
              style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}>
              <LinearGradient
                colors={theme.primaryGradient}
                start={Gradients.diagonal.start}
                end={Gradients.diagonal.end}
                style={{ padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'FjallaOne_400Regular'}}>Open Room →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // ── Choose Mode Screen ──
    if (mode === 'choose') {
      return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
              <ArrowLeft size={22} color={theme.ink} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink , fontFamily: 'FjallaOne_400Regular'}}>Shared Expenses</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.muted, marginTop: 2 , fontFamily: 'FjallaOne_400Regular'}}>Cloud-synced with your roommate</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
            {/* Hero */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ backgroundColor: theme.primary + '12', width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Cloud size={36} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink, textAlign: 'center', marginBottom: 8 , fontFamily: 'FjallaOne_400Regular'}}>
                Real-time Expense Sharing
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, textAlign: 'center', lineHeight: 22 , fontFamily: 'FjallaOne_400Regular'}}>
                Both you and your roommate can add, edit, and remove expenses from your own phones — synced instantly.
              </Text>
            </View>

            {/* Create Card */}
            <TouchableOpacity onPress={() => setMode('create')} activeOpacity={0.8}
              style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: theme.primary + '30', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: theme.primary + '15', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={24} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme.ink, marginBottom: 4 , fontFamily: 'FjallaOne_400Regular'}}>Create a Room</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, lineHeight: 19 , fontFamily: 'FjallaOne_400Regular'}}>
                  Start a new shared room and get a code to share with your roommate
                </Text>
              </View>
            </TouchableOpacity>

            {/* Join Card */}
            <TouchableOpacity onPress={() => setMode('join')} activeOpacity={0.8}
              style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: theme.success + '30', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: theme.success + '15', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                <LogIn size={24} color={theme.success} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme.ink, marginBottom: 4 , fontFamily: 'FjallaOne_400Regular'}}>Join a Room</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, lineHeight: 19 , fontFamily: 'FjallaOne_400Regular'}}>
                  Enter a code shared by your roommate to join their expense room
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // ── Create / Join Forms ──
    const isCreate = mode === 'create';

    return (
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: theme.background }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <TouchableOpacity onPress={() => setMode('choose')} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={theme.ink} />
          </TouchableOpacity>
            {isCreate ? 'Create Room' : 'Join Room'}
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          {/* Display Name */}
          <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Your Display Name</Text>
          <TextInput
            style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.ink, fontSize: 16, marginBottom: 20, fontWeight: '600' }}
            placeholder="e.g. Shahid, Arjun"
            placeholderTextColor={theme.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

          {isCreate && (
            <>
              {/* Room Name */}
              <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Room Name</Text>
              <TextInput
                style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.ink, fontSize: 16, marginBottom: 20, fontWeight: '600' }}
                placeholder="e.g. Flat 302, PG Room"
                placeholderTextColor={theme.muted}
                value={roomName}
                onChangeText={setRoomName}
              />

              {/* Custom Code (optional) */}
              <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Room Code (optional — leave blank for random)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.primary, fontSize: 18, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' }}
                  placeholder="AUTO"
                  placeholderTextColor={theme.muted + '50'}
                  value={roomCode}
                  onChangeText={(t) => setRoomCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <TouchableOpacity onPress={() => setRoomCode(generateCode())} activeOpacity={0.7}
                  style={{ width: 48, borderRadius: 12, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.primary + '30' }}>
                  <Shuffle size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: theme.muted, fontWeight: '600', marginBottom: 24 , fontFamily: 'FjallaOne_400Regular'}}>
                Leave blank to auto-generate a 6-character code
              </Text>
            </>
          )}

          {!isCreate && (
            <>
              {/* Enter Room Code */}
              <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Room Code</Text>
              <TextInput
                style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.success, fontSize: 20, fontWeight: '900', letterSpacing: 6, marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' }}
                placeholder="ENTER CODE"
                placeholderTextColor={theme.muted + '50'}
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                autoCapitalize="characters"
                maxLength={8}
              />
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={isCreate ? handleCreate : handleJoin}
            activeOpacity={0.85}
            disabled={loading}
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={isCreate ? theme.primaryGradient : theme.successGradient || [theme.success, theme.success]}
              start={Gradients.diagonal.start}
              end={Gradients.diagonal.end}
              style={{
                padding: 16, alignItems: 'center',
                flexDirection: 'row', justifyContent: 'center', gap: 10,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  {isCreate ? <Plus size={22} color="#fff" strokeWidth={3} /> : <LogIn size={22} color="#fff" strokeWidth={2.5} />}
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'FjallaOne_400Regular'}}>
                    {isCreate ? 'Create Room' : 'Join Room'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
