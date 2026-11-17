import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { useSharedRoomStore } from '../store/useSharedRoomStore';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, X, Check, Trash2, ArrowUpRight, ArrowDownLeft, CheckCircle, Circle, Copy, Users, Cloud, LogOut, Receipt, WifiOff, Wifi } from 'lucide-react-native';
import { SharedRoomEntry, SharedRoomMember } from '../types/database';
import { supabase } from '../config/supabaseConfig';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { isInternetReachable } from '../utils/network';

export default function SharedRoom() {
  const { code } = useLocalSearchParams();
  const roomCode = (code as string) || '';
  const { isDark } = useThemeStore();
  const { getRoomByCode, removeRoom, getCachedRoom, setCachedRoom, loadCache } = useSharedRoomStore();
  const localRoom = getRoomByCode(roomCode);

  const [roomName, setRoomName] = useState(localRoom?.roomName || 'Shared Room');
  const [members, setMembers] = useState<Record<string, SharedRoomMember>>({});
  const [entries, setEntries] = useState<SharedRoomEntry[]>([]);
  const [netBalances, setNetBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = isDark ? Colors.dark : Colors.light;

  const myMemberId = localRoom?.myMemberId || '';
  const myName = localRoom?.myName || 'Me';

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Check network and load cache on mount ──
  useEffect(() => {
    if (!roomCode) return;

    const init = async () => {
      // Load cache first for instant offline display
      await loadCache();
      const cached = getCachedRoom(roomCode);
      if (cached) {
        setRoomName(cached.roomName || localRoom?.roomName || 'Shared Room');
        setMembers(cached.members || {});
        setEntries(cached.entries || []);
        setLastSynced(cached.lastSynced || null);
        setLoading(false); // Show cached immediately
      }

      // Check connectivity
      const online = await isInternetReachable();
      setIsOnline(online);

      if (online) {
        await fetchRoomData();
        subscribeRealtime();
      } else {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]);

  // ── Poll network state every 5s to auto-reconnect ──
  useEffect(() => {
    const interval = setInterval(async () => {
      const online = await isInternetReachable();
      if (online && !isOnline) {
        // Just came back online — sync
        setIsOnline(true);
        await fetchRoomData();
        subscribeRealtime();
      } else if (!online && isOnline) {
        setIsOnline(false);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const subscribeRealtime = () => {
    if (channelRef.current) return; // Already subscribed
    const channel = supabase.channel(`room_${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_code=eq.${roomCode}` }, () => fetchRoomData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_entries', filter: `room_code=eq.${roomCode}` }, () => fetchRoomData())
      .subscribe();
    channelRef.current = channel;
  };

  // ── Shared data fetcher ──
  const fetchRoomData = async () => {
    try {
      const { data: roomData } = await supabase.from('shared_rooms').select('room_name').eq('code', roomCode).single();
      const fetchedRoomName = roomData?.room_name || localRoom?.roomName || 'Shared Room';
      if (roomData) setRoomName(fetchedRoomName);

      const { data: membersData } = await supabase.from('room_members').select('*').eq('room_code', roomCode);
      const memObj: Record<string, SharedRoomMember> = {};
      if (membersData) {
        membersData.forEach(m => memObj[m.id] = { name: m.name, joinedAt: m.joined_at });
        setMembers(memObj);
      }

      const { data: entriesData } = await supabase.from('room_entries').select('*').eq('room_code', roomCode).order('date', { ascending: false }).order('created_at', { ascending: false });
      const mappedEntries: SharedRoomEntry[] = [];
      if (entriesData) {
        entriesData.forEach(e => mappedEntries.push({
          id: e.id, paidByMemberId: e.paid_by_member_id, paidByName: e.paid_by_name,
          amount: Number(e.amount), description: e.description, date: e.date, isPaid: e.is_paid, createdAt: e.created_at
        }));
        setEntries(mappedEntries);
      }

      // Update cache
      const now = new Date().toISOString();
      setLastSynced(now);
      await setCachedRoom(roomCode, {
        roomName: fetchedRoomName,
        members: memObj,
        entries: mappedEntries,
        lastSynced: now,
      });
    } catch (err) {
      console.warn('Supabase Load Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    const online = await isInternetReachable();
    setIsOnline(online);
    if (!online) {
      setRefreshing(false);
      Alert.alert('Offline', 'Cannot refresh — no internet connection. Showing cached data.');
      return;
    }
    setRefreshing(true);
    fetchRoomData().catch(() => {}).finally(() => setRefreshing(false));
  };

  // ── Calculate net balances ──
  useEffect(() => {
    const bals: Record<string, number> = {};
    const pending = entries.filter(e => !e.isPaid);
    const memberIds = Object.keys(members);

    for (const e of pending) {
      if (!bals[e.paidByMemberId]) bals[e.paidByMemberId] = 0;
      bals[e.paidByMemberId] += e.amount;
      for (const mid of memberIds) {
        if (mid !== e.paidByMemberId) {
          if (!bals[mid]) bals[mid] = 0;
          bals[mid] -= e.amount;
        }
      }
    }
    setNetBalances(bals);
  }, [entries, members]);

  const myBalance = netBalances[myMemberId] || 0;

  // ── Entry CRUD ──
  const openAddModal = async () => {
    const online = await isInternetReachable();
    if (!online) {
      Alert.alert('You\'re Offline', 'Connect to the internet to add entries.');
      return;
    }
    setEditingId(null);
    setFormAmount('');
    setFormDesc('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (entry: SharedRoomEntry) => {
    setEditingId(entry.id);
    setFormAmount(entry.amount.toString());
    setFormDesc(entry.description);
    setFormDate(entry.date);
    setShowModal(true);
  };

  const saveEntry = async () => {
    const online = await isInternetReachable();
    if (!online) {
      Alert.alert('You\'re Offline', 'Connect to the internet to save entries.');
      return;
    }

    const amt = parseFloat(formAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (!formDesc.trim()) { Alert.alert('Error', 'Description is required'); return; }

    try {
      if (editingId) {
        await supabase
          .from('room_entries')
          .update({
            amount: amt,
            description: formDesc.trim(),
            date: formDate
          })
          .eq('id', editingId);
      } else {
        await supabase
          .from('room_entries')
          .insert({
            room_code: roomCode,
            paid_by_member_id: myMemberId,
            paid_by_name: myName,
            amount: amt,
            description: formDesc.trim(),
            date: formDate,
            is_paid: false,
            created_at: new Date().toISOString()
          });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save. Check your connection.');
    }
  };

  const togglePaid = async (entry: SharedRoomEntry) => {
    const online = await isInternetReachable();
    if (!online) { Alert.alert('You\'re Offline', 'Connect to the internet to update entries.'); return; }
    try {
      await supabase.from('room_entries').update({ is_paid: !entry.isPaid }).eq('id', entry.id);
    } catch { Alert.alert('Error', 'Failed to update'); }
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert('Delete Entry?', 'This will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const online = await isInternetReachable();
        if (!online) { Alert.alert('You\'re Offline', 'Connect to the internet to delete entries.'); return; }
        try {
          await supabase.from('room_entries').delete().eq('id', entryId);
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const handleEntryAction = (entry: SharedRoomEntry) => {
    Alert.alert('Entry Actions', entry.description, [
      { text: 'Cancel', style: 'cancel' },
      { text: entry.isPaid ? 'Mark Pending' : 'Mark Settled', onPress: () => togglePaid(entry) },
      { text: 'Edit', onPress: () => openEditModal(entry) },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const copyCode = () => {
    Alert.alert('Room Code', roomCode);
  };

  const leaveRoom = () => {
    Alert.alert('Room Options', 'You can leave this room. If you are the last person, the room will be deleted permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave Room', style: 'destructive', onPress: async () => {
        const online = await isInternetReachable();
        if (!online) { Alert.alert('You\'re Offline', 'Connect to the internet to leave the room.'); return; }
        try {
          await supabase.from('room_members').delete().eq('id', myMemberId);
          
          const { count } = await supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('room_code', roomCode);
          if (count === 0) {
            await supabase.from('shared_rooms').delete().eq('code', roomCode);
          }
          
          await removeRoom(roomCode);
          router.back();
        } catch (e) {
          Alert.alert('Error', 'Failed to leave room');
        }
      }},
    ]);
  };

  const memberList = Object.entries(members);
  const absBalance = Math.abs(myBalance);

  // Format last synced time
  const formatSyncTime = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!localRoom) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 8 , fontFamily: 'FjallaOne_400Regular'}}>Room not found</Text>
        <Text style={{ fontSize: 14, color: theme.muted, textAlign: 'center' , fontFamily: 'FjallaOne_400Regular'}}>This room is no longer in your local storage.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, borderRadius: 14, overflow: 'hidden' }}>
          <LinearGradient
            colors={theme.primaryGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' , fontFamily: 'FjallaOne_400Regular'}}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'FjallaOne_400Regular'}} numberOfLines={1}>{roomName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {isOnline ? (
                <>
                  <Wifi size={11} color={theme.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary , fontFamily: 'FjallaOne_400Regular'}}>Live Synced</Text>
                </>
              ) : (
                <>
                  <WifiOff size={11} color={theme.danger} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.danger , fontFamily: 'FjallaOne_400Regular'}}>Offline</Text>
                  {lastSynced && (
                    <Text style={{ fontSize: 11, color: theme.muted, fontFamily: 'FjallaOne_400Regular' }}>• cached {formatSyncTime(lastSynced)}</Text>
                  )}
                </>
              )}
              <Text style={{ fontSize: 11, color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>•</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>{roomCode}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={leaveRoom} activeOpacity={0.7}
          style={{ padding: 10, borderRadius: 14, backgroundColor: theme.danger + '12', borderWidth: 1, borderColor: theme.danger + '25' }}>
          <LogOut size={18} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {!isOnline && (
        <View style={{ backgroundColor: theme.danger + '15', borderBottomWidth: 1, borderBottomColor: theme.danger + '30', paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <WifiOff size={14} color={theme.danger} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.danger, fontFamily: 'FjallaOne_400Regular', flex: 1 }}>
            You're offline — showing cached data. Writes are disabled.
          </Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, padding: 20 }}>
          {/* Skeleton Loaders */}
          <View style={{ backgroundColor: theme.card, borderRadius: 20, height: 120, marginBottom: 20, opacity: 0.5 }} />
          <View style={{ backgroundColor: theme.card, borderRadius: 16, height: 80, marginBottom: 20, opacity: 0.5 }} />
          <View style={{ backgroundColor: theme.card, borderRadius: 22, height: 200, opacity: 0.5 }} />
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >

          {/* Net Balance Card */}
          <View style={{
            backgroundColor: myBalance === 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : myBalance > 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : (isDark ? 'rgba(244,63,94,0.08)' : '#FFF1F2'),
            borderRadius: 20, padding: 20, marginBottom: 20,
            borderWidth: 1.5,
            borderColor: myBalance === 0 ? theme.success + '30' : myBalance > 0 ? theme.success + '30' : theme.danger + '30',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 , fontFamily: 'FjallaOne_400Regular'}}>
              Your Balance
            </Text>
            {myBalance === 0 ? (
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: theme.success , fontFamily: 'FjallaOne_400Regular'}}>All Settled!</Text>
                <Text style={{ fontSize: 14, color: theme.muted, fontWeight: '600', marginTop: 4 , fontFamily: 'FjallaOne_400Regular'}}>No pending dues</Text>
              </View>
            ) : myBalance > 0 ? (
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>₹{absBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 14, color: theme.success, fontWeight: '700', marginTop: 4 , fontFamily: 'FjallaOne_400Regular'}}>You will receive (Take)</Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: theme.danger, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>₹{absBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 14, color: theme.danger, fontWeight: '700', marginTop: 4 , fontFamily: 'FjallaOne_400Regular'}}>You have to give (Pay)</Text>
              </View>
            )}
          </View>

          {/* Members */}
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={16} color={theme.primary} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ink , fontFamily: 'FjallaOne_400Regular'}}>Members ({memberList.length})</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={copyCode} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: theme.primary + '12' }}>
                <Copy size={12} color={theme.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary , fontFamily: 'FjallaOne_400Regular'}}>{roomCode}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {memberList.map(([id, m]) => {
                const isMe = id === myMemberId;
                return (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isMe ? theme.primary + '15' : theme.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: isMe ? theme.primary + '30' : theme.border }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isMe ? theme.primary : theme.success, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' , fontFamily: 'FjallaOne_400Regular'}}>{(m.name || 'U').charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isMe ? theme.primary : theme.ink , fontFamily: 'FjallaOne_400Regular'}}>{m.name || 'Unknown'}{isMe ? ' (You)' : ''}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Entries Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.ink , fontFamily: 'FjallaOne_400Regular'}}>Entries</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>Long press to manage</Text>
          </View>

          {/* Entry List */}
          {entries.length === 0 ? (
            <View style={{ backgroundColor: theme.card, borderRadius: 22, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}>
              <Receipt size={36} color={theme.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.ink, marginBottom: 6 , fontFamily: 'FjallaOne_400Regular'}}>No entries yet</Text>
              <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'FjallaOne_400Regular'}}>Tap + to add who paid for what</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: theme.card, borderRadius: 22, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
              {entries.map((entry, i) => {
                const isMe = entry.paidByMemberId === myMemberId;
                const isPaid = !!entry.isPaid;
                const entryColor = isMe ? theme.success : theme.danger;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => togglePaid(entry)}
                    onLongPress={() => handleEntryAction(entry)}
                    delayLongPress={350}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
                      borderBottomWidth: i < entries.length - 1 ? 1 : 0, borderBottomColor: theme.border,
                      opacity: isPaid ? 0.45 : 1,
                    }}>
                    <View style={{ marginRight: 12 }}>
                      {isPaid ? <CheckCircle size={22} color={theme.success} /> : <Circle size={22} color={theme.border} />}
                    </View>
                    <View style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: entryColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                      {isMe ? <ArrowUpRight size={18} color={entryColor} strokeWidth={2.5} /> : <ArrowDownLeft size={18} color={entryColor} strokeWidth={2.5} />}
                    </View>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 3, textDecorationLine: isPaid ? 'line-through' : 'none' , fontFamily: 'FjallaOne_400Regular'}} numberOfLines={1}>{entry.description}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: entryColor + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: entryColor, textTransform: 'uppercase' , fontFamily: 'FjallaOne_400Regular'}}>
                            {entry.paidByName} paid
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted , fontFamily: 'FjallaOne_400Regular'}}>
                          {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: entryColor, fontVariant: ['tabular-nums'] , fontFamily: 'FjallaOne_400Regular'}}>₹{entry.amount.toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity onPress={openAddModal} activeOpacity={0.85} style={{
        position: 'absolute', bottom: 32, right: 20,
        width: 56, height: 56, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: theme.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12,
        overflow: 'hidden'
      }}>
        <LinearGradient
          colors={isOnline ? theme.primaryGradient : [theme.muted, theme.muted]}
          start={Gradients.diagonal.start}
          end={Gradients.diagonal.end}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={28} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 380 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink , fontFamily: 'FjallaOne_400Regular'}}>{editingId ? 'Edit Entry' : 'Add Entry'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color={theme.muted} /></TouchableOpacity>
            </View>

            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>What was it for?</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 16, fontWeight: '600' }}
              placeholder="e.g. Groceries, Electricity"
              placeholderTextColor={theme.muted}
              value={formDesc}
              onChangeText={setFormDesc}
            />

            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Amount (₹)</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.success, fontSize: 24, fontWeight: '900', marginBottom: 16, fontVariant: ['tabular-nums'] }}
              placeholder="0"
              placeholderTextColor={theme.muted + '50'}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'FjallaOne_400Regular'}}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 10, fontWeight: '600' }}
              placeholder="2026-07-21"
              placeholderTextColor={theme.muted}
              value={formDate}
              onChangeText={setFormDate}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {[{ label: 'Today', offset: 0 }, { label: 'Yesterday', offset: -1 }, { label: '2 days ago', offset: -2 }].map(({ label, offset }) => {
                const d = new Date(); d.setDate(d.getDate() + offset);
                const val = d.toISOString().split('T')[0];
                return (
                  <TouchableOpacity key={label} onPress={() => setFormDate(val)} activeOpacity={0.7}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: formDate === val ? theme.primary : theme.border, backgroundColor: formDate === val ? theme.primary + '15' : theme.surface }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: formDate === val ? theme.primary : theme.muted , fontFamily: 'FjallaOne_400Regular'}}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={saveEntry} activeOpacity={0.85}
              style={{ borderRadius: 18, overflow: 'hidden' }}>
              <LinearGradient
                colors={theme.primaryGradient}
                start={Gradients.diagonal.start}
                end={Gradients.diagonal.end}
                style={{ padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                <Check size={22} color="#fff" strokeWidth={3} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'FjallaOne_400Regular'}}>{editingId ? 'Save Changes' : 'Add Entry'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
