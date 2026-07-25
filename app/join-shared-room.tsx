  import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Share } from 'react-native';
  import { CustomAlert as Alert } from '../utils/alert';
  import { router } from 'expo-router';
  import { useThemeStore } from '../store/useThemeStore';
  import { useSharedRoomStore } from '../store/useSharedRoomStore';
  import { useState } from 'react';
  import { ArrowLeft, Plus, LogIn, Copy, Shuffle, Cloud, Users, Sparkles } from 'lucide-react-native';
  import { firebaseDB } from '../config/firebaseConfig';
  import { ref, set, get, push } from 'firebase/database';

  function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/1/O/0 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  export default function JoinSharedRoom() {
    const { isDark } = useThemeStore();
    const { addRoom } = useSharedRoomStore();

    const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
    const [displayName, setDisplayName] = useState('');
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);

    const bg = isDark ? '#0F172A' : '#F8FAFC';
    const card = isDark ? '#1E293B' : '#FFFFFF';
    const raised = isDark ? '#334155' : '#F1F5F9';
    const border = isDark ? '#334155' : '#E2E8F0';
    const ink = isDark ? '#F8FAFC' : '#0F172A';
    const muted = isDark ? '#94A3B8' : '#64748B';
    const primary = '#8B5CF6';
    const success = '#10B981';
    const accent2 = '#3B82F6';

    const handleCreate = async () => {
      if (!displayName.trim()) { Alert.alert('Oops', 'Enter your display name'); return; }
      if (!roomName.trim()) { Alert.alert('Oops', 'Give your shared room a name'); return; }

      const code = roomCode.trim().toUpperCase() || generateCode();

      setLoading(true);
      try {
        // Check if code already exists
        const roomRef = ref(firebaseDB, `shared_rooms/${code}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
          Alert.alert('Code Taken', `The code "${code}" is already in use. Try a different one or generate a random code.`);
          setLoading(false);
          return;
        }

        const memberId = `member_${Date.now()}`;
        const now = new Date().toISOString();

        // Create room in Firebase
        await set(roomRef, {
          meta: {
            createdAt: now,
            createdBy: displayName.trim(),
            roomName: roomName.trim(),
          },
          members: {
            [memberId]: {
              name: displayName.trim(),
              joinedAt: now,
            },
          },
        });

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
        const roomRef = ref(firebaseDB, `shared_rooms/${code}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
          Alert.alert('Not Found', `No room found with code "${code}". Double-check the code.`);
          setLoading(false);
          return;
        }

        const roomData = snapshot.val();
        const memberId = `member_${Date.now()}`;
        const now = new Date().toISOString();

        // Add self as member
        const memberRef = ref(firebaseDB, `shared_rooms/${code}/members/${memberId}`);
        await set(memberRef, {
          name: displayName.trim(),
          joinedAt: now,
        });

        // Save locally
        await addRoom({
          roomCode: code,
          myMemberId: memberId,
          myName: displayName.trim(),
          roomName: roomData.meta?.roomName || 'Shared Room',
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
          message: `🏠 Join my shared expense room on PaisaPilot!\n\nRoom: ${roomName}\nCode: ${createdCode}\n\nDownload PaisaPilot and enter this code to start tracking our shared expenses! 💸`,
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
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
              <ArrowLeft size={22} color={ink} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Room Created! 🎉</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', paddingTop: 48 }}>
            <View style={{ backgroundColor: primary + '15', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Sparkles size={40} color={primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: ink, textAlign: 'center', marginBottom: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>
              Your room is ready!
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: muted, textAlign: 'center', marginBottom: 32, lineHeight: 22 , fontFamily: 'DMSans_500Medium'}}>
              Share this code with your roommate so they can join and start adding expenses together.
            </Text>

            {/* Code Display */}
            <View style={{ backgroundColor: card, borderRadius: 24, padding: 28, borderWidth: 2, borderColor: primary + '40', marginBottom: 24, width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 , fontFamily: 'CormorantGaramond_700Bold'}}>Room Code</Text>
              <Text style={{ fontSize: 42, fontWeight: '900', color: primary, letterSpacing: 8, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                {createdCode}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: muted, marginTop: 8 , fontFamily: 'DMSans_500Medium'}}>{roomName}</Text>
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
                  padding: 16,
                  borderRadius: 24,
                  backgroundColor: '#25D36615',
                  borderWidth: 1,
                  borderColor: '#25D36630',
                }}>
                <Text style={{ fontSize: 16 , fontFamily: 'DMSans_500Medium'}}>📤</Text>
                <Text style={{ fontWeight: '800', fontSize: 14, color: '#25D366' , fontFamily: 'CormorantGaramond_700Bold'}}>
                  Share Room Code
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goToRoom} activeOpacity={0.85}
              style={{ width: '100%', padding: 18, borderRadius: 18, alignItems: 'center', backgroundColor: primary, shadowColor: primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'CormorantGaramond_700Bold'}}>Open Room →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // ── Choose Mode Screen ──
    if (mode === 'choose') {
      return (
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
              <ArrowLeft size={22} color={ink} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Shared Expenses ☁️</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: muted, marginTop: 2 , fontFamily: 'DMSans_500Medium'}}>Cloud-synced with your roommate</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
            {/* Hero */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ backgroundColor: primary + '12', width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Cloud size={36} color={primary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: ink, textAlign: 'center', marginBottom: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>
                Real-time Expense Sharing
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: muted, textAlign: 'center', lineHeight: 22 , fontFamily: 'DMSans_500Medium'}}>
                Both you and your roommate can add, edit, and remove expenses from your own phones — synced instantly.
              </Text>
            </View>

            {/* Create Card */}
            <TouchableOpacity onPress={() => setMode('create')} activeOpacity={0.8}
              style={{ backgroundColor: card, borderRadius: 22, padding: 24, marginBottom: 16, borderWidth: 1.5, borderColor: primary + '30', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: primary + '15', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={26} color={primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: ink, marginBottom: 4 , fontFamily: 'CormorantGaramond_700Bold'}}>Create a Room</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: muted, lineHeight: 19 , fontFamily: 'DMSans_500Medium'}}>
                  Start a new shared room and get a code to share with your roommate
                </Text>
              </View>
            </TouchableOpacity>

            {/* Join Card */}
            <TouchableOpacity onPress={() => setMode('join')} activeOpacity={0.8}
              style={{ backgroundColor: card, borderRadius: 22, padding: 24, borderWidth: 1.5, borderColor: success + '30', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: success + '15', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                <LogIn size={26} color={success} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: ink, marginBottom: 4 , fontFamily: 'CormorantGaramond_700Bold'}}>Join a Room</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: muted, lineHeight: 19 , fontFamily: 'DMSans_500Medium'}}>
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
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
          <TouchableOpacity onPress={() => setMode('choose')} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={ink} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>
            {isCreate ? 'Create Room 🏠' : 'Join Room 🤝'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          {/* Display Name */}
          <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Your Display Name</Text>
          <TextInput
            style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: ink, fontSize: 16, marginBottom: 20, fontWeight: '600' }}
            placeholder="e.g. Shahid, Arjun"
            placeholderTextColor={muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

          {isCreate && (
            <>
              {/* Room Name */}
              <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Room Name</Text>
              <TextInput
                style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: ink, fontSize: 16, marginBottom: 20, fontWeight: '600' }}
                placeholder="e.g. Flat 302, PG Room"
                placeholderTextColor={muted}
                value={roomName}
                onChangeText={setRoomName}
              />

              {/* Custom Code (optional) */}
              <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Room Code (optional — leave blank for random)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: primary, fontSize: 20, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' }}
                  placeholder="AUTO"
                  placeholderTextColor={isDark ? '#334155' : '#CBD5E1'}
                  value={roomCode}
                  onChangeText={(t) => setRoomCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <TouchableOpacity onPress={() => setRoomCode(generateCode())} activeOpacity={0.7}
                  style={{ width: 52, borderRadius: 14, backgroundColor: primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: primary + '30' }}>
                  <Shuffle size={22} color={primary} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: muted, fontWeight: '600', marginBottom: 24 , fontFamily: 'DMSans_500Medium'}}>
                Leave blank to auto-generate a 6-character code
              </Text>
            </>
          )}

          {!isCreate && (
            <>
              {/* Enter Room Code */}
              <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Room Code</Text>
              <TextInput
                style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: success, fontSize: 24, fontWeight: '900', letterSpacing: 6, marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' }}
                placeholder="ENTER CODE"
                placeholderTextColor={isDark ? '#334155' : '#CBD5E1'}
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
            style={{
              backgroundColor: isCreate ? primary : success,
              padding: 18, borderRadius: 18, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 10,
              opacity: loading ? 0.6 : 1,
              shadowColor: isCreate ? primary : success,
              shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
            }}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                {isCreate ? <Plus size={22} color="#fff" strokeWidth={3} /> : <LogIn size={22} color="#fff" strokeWidth={2.5} />}
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'CormorantGaramond_700Bold'}}>
                  {isCreate ? 'Create Room' : 'Join Room'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
