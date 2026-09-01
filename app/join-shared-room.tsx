  import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Share } from 'react-native';
  import { CustomAlert as Alert } from '../utils/alert';
  import { router } from 'expo-router';
  import { useThemeStore } from '../store/useThemeStore';
  import { useSharedRoomStore } from '../store/useSharedRoomStore';
  import { useState } from 'react';
  import { Copy, Shuffle, Cloud, Users, Sparkles, ArrowLeft, Plus, LogIn } from 'lucide-react-native';
  import { firebaseDB } from '../config/firebaseConfig';
  import { ref, set, get, push } from 'firebase/database';
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
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
              <ArrowLeft size={22} color={theme.ink} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Room Created! 🎉</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', paddingTop: 48 }}>
            <View style={{ backgroundColor: theme.primary + '15', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Sparkles size={40} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.ink, textAlign: 'center', marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>
              Your room is ready!
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, textAlign: 'center', marginBottom: 32, lineHeight: 22 , fontFamily: 'Inter_500Medium'}}>
              Share this code with your roommate so they can join and start adding expenses together.
            </Text>

            {/* Code Display */}
            <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 28, borderWidth: 2, borderColor: theme.primary + '40', marginBottom: 24, width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 , fontFamily: 'Outfit_700Bold'}}>Room Code</Text>
              <Text style={{ fontSize: 42, fontWeight: '900', color: theme.primary, letterSpacing: 8, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
                {createdCode}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, marginTop: 8 , fontFamily: 'Inter_500Medium'}}>{roomName}</Text>
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
                <Text style={{ fontSize: 16 , fontFamily: 'Inter_500Medium'}}>📤</Text>
                <Text style={{ fontWeight: '800', fontSize: 14, color: '#25D366' , fontFamily: 'Outfit_700Bold'}}>
                  Share Room Code
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goToRoom} activeOpacity={0.85}
              style={{ width: '100%', borderRadius: 18, overflow: 'hidden' }}>
              <LinearGradient
                colors={theme.primaryGradient}
                start={Gradients.diagonal.start}
                end={Gradients.diagonal.end}
                style={{ padding: 18, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'Outfit_700Bold'}}>Open Room →</Text>
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
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Shared Expenses ☁️</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.muted, marginTop: 2 , fontFamily: 'Inter_500Medium'}}>Cloud-synced with your roommate</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
            {/* Hero */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ backgroundColor: theme.primary + '12', width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Cloud size={36} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink, textAlign: 'center', marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>
                Real-time Expense Sharing
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, textAlign: 'center', lineHeight: 22 , fontFamily: 'Inter_500Medium'}}>
                Both you and your roommate can add, edit, and remove expenses from your own phones — synced instantly.
              </Text>
            </View>

            {/* Create Card */}
            <TouchableOpacity onPress={() => setMode('create')} activeOpacity={0.8}
              style={{ backgroundColor: theme.card, borderRadius: 22, padding: 24, marginBottom: 16, borderWidth: 1.5, borderColor: theme.primary + '30', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: theme.primary + '15', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={26} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme.ink, marginBottom: 4 , fontFamily: 'Outfit_700Bold'}}>Create a Room</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, lineHeight: 19 , fontFamily: 'Inter_500Medium'}}>
                  Start a new shared room and get a code to share with your roommate
                </Text>
              </View>
            </TouchableOpacity>

            {/* Join Card */}
            <TouchableOpacity onPress={() => setMode('join')} activeOpacity={0.8}
              style={{ backgroundColor: theme.card, borderRadius: 22, padding: 24, borderWidth: 1.5, borderColor: theme.success + '30', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: theme.success + '15', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                <LogIn size={26} color={theme.success} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme.ink, marginBottom: 4 , fontFamily: 'Outfit_700Bold'}}>Join a Room</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted, lineHeight: 19 , fontFamily: 'Inter_500Medium'}}>
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
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <TouchableOpacity onPress={() => setMode('choose')} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={theme.ink} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>
            {isCreate ? 'Create Room 🏠' : 'Join Room 🤝'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          {/* Display Name */}
          <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Your Display Name</Text>
          <TextInput
            style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 20, fontWeight: '600' }}
            placeholder="e.g. Shahid, Arjun"
            placeholderTextColor={theme.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

          {isCreate && (
            <>
              {/* Room Name */}
              <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Room Name</Text>
              <TextInput
                style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 20, fontWeight: '600' }}
                placeholder="e.g. Flat 302, PG Room"
                placeholderTextColor={theme.muted}
                value={roomName}
                onChangeText={setRoomName}
              />

              {/* Custom Code (optional) */}
              <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Room Code (optional — leave blank for random)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.primary, fontSize: 20, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' }}
                  placeholder="AUTO"
                  placeholderTextColor={theme.muted + '50'}
                  value={roomCode}
                  onChangeText={(t) => setRoomCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <TouchableOpacity onPress={() => setRoomCode(generateCode())} activeOpacity={0.7}
                  style={{ width: 52, borderRadius: 14, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.primary + '30' }}>
                  <Shuffle size={22} color={theme.primary} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: theme.muted, fontWeight: '600', marginBottom: 24 , fontFamily: 'Inter_500Medium'}}>
                Leave blank to auto-generate a 6-character code
              </Text>
            </>
          )}

          {!isCreate && (
            <>
              {/* Enter Room Code */}
              <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Room Code</Text>
              <TextInput
                style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.success, fontSize: 24, fontWeight: '900', letterSpacing: 6, marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' }}
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
            style={{ borderRadius: 18, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={isCreate ? theme.primaryGradient : theme.successGradient || [theme.success, theme.success]}
              start={Gradients.diagonal.start}
              end={Gradients.diagonal.end}
              style={{
                padding: 18, alignItems: 'center',
                flexDirection: 'row', justifyContent: 'center', gap: 10,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  {isCreate ? <Plus size={22} color="#fff" strokeWidth={3} /> : <LogIn size={22} color="#fff" strokeWidth={2.5} />}
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'Outfit_700Bold'}}>
                    {isCreate ? 'Create Room' : 'Join Room'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
