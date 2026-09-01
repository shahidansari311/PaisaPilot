import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Share as RNShare, ActivityIndicator } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { useSharedRoomStore } from '../store/useSharedRoomStore';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Plus, X, Check, Trash2, ArrowUpRight, ArrowDownLeft, CheckCircle, Circle, Copy, Users, Cloud, LogOut } from 'lucide-react-native';
import { SharedRoomEntry, SharedRoomMember } from '../types/database';
import { firebaseDB } from '../config/firebaseConfig';
import { ref, onValue, set, remove, push, get, off } from 'firebase/database';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function SharedRoom() {
  const { code } = useLocalSearchParams();
  const roomCode = (code as string) || '';
  const { isDark } = useThemeStore();
  const { getRoomByCode, removeRoom } = useSharedRoomStore();
  const localRoom = getRoomByCode(roomCode);

  const [roomName, setRoomName] = useState(localRoom?.roomName || 'Shared Room');
  const [members, setMembers] = useState<Record<string, SharedRoomMember>>({});
  const [entries, setEntries] = useState<SharedRoomEntry[]>([]);
  const [netBalances, setNetBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const theme = isDark ? Colors.dark : Colors.light;

  const myMemberId = localRoom?.myMemberId || '';
  const myName = localRoom?.myName || 'Me';

  // ── Real-time listeners ──
  useEffect(() => {
    if (!roomCode) return;
    const metaRef = ref(firebaseDB, `shared_rooms/${roomCode}/meta`);
    const membersRef = ref(firebaseDB, `shared_rooms/${roomCode}/members`);
    const entriesRef = ref(firebaseDB, `shared_rooms/${roomCode}/entries`);

    const unsubMeta = onValue(metaRef, (snap) => {
      if (snap.exists()) setRoomName(snap.val().roomName || 'Shared Room');
    });
    const unsubMembers = onValue(membersRef, (snap) => {
      if (snap.exists()) setMembers(snap.val());
      else setMembers({});
    });
    const unsubEntries = onValue(entriesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr: SharedRoomEntry[] = Object.keys(data).map(k => ({ ...data[k], id: k }));
        arr.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
        setEntries(arr);
      } else {
        setEntries([]);
      }
      setLoading(false);
    });

    return () => {
      off(metaRef);
      off(membersRef);
      off(entriesRef);
    };
  }, [roomCode]);

  // ── Calculate net balances ──
  useEffect(() => {
    const bals: Record<string, number> = {};
    const pending = entries.filter(e => !e.isPaid);
    const memberIds = Object.keys(members);

    for (const e of pending) {
      if (!bals[e.paidByMemberId]) bals[e.paidByMemberId] = 0;
      bals[e.paidByMemberId] += e.amount; // They are owed this full amount
      for (const mid of memberIds) {
        if (mid !== e.paidByMemberId) {
          if (!bals[mid]) bals[mid] = 0;
          bals[mid] -= e.amount; // Deducted from others in full
        }
      }
    }
    setNetBalances(bals);
  }, [entries, members]);

  const myBalance = netBalances[myMemberId] || 0;

  // ── Entry CRUD ──
  const openAddModal = () => {
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
    const amt = parseFloat(formAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (!formDesc.trim()) { Alert.alert('Error', 'Description is required'); return; }

    try {
      if (editingId) {
        const entryRef = ref(firebaseDB, `shared_rooms/${roomCode}/entries/${editingId}`);
        const snap = await get(entryRef);
        if (snap.exists()) {
          await set(entryRef, { ...snap.val(), amount: amt, description: formDesc.trim(), date: formDate });
        }
      } else {
        const entriesRef = ref(firebaseDB, `shared_rooms/${roomCode}/entries`);
        const newRef = push(entriesRef);
        await set(newRef, {
          paidByName: myName,
          paidByMemberId: myMemberId,
          amount: amt,
          description: formDesc.trim(),
          date: formDate,
          isPaid: false,
          createdAt: new Date().toISOString(),
        });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save. Check your connection.');
    }
  };

  const togglePaid = async (entry: SharedRoomEntry) => {
    try {
      const entryRef = ref(firebaseDB, `shared_rooms/${roomCode}/entries/${entry.id}/isPaid`);
      await set(entryRef, !entry.isPaid);
    } catch { Alert.alert('Error', 'Failed to update'); }
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert('Delete Entry? 🗑️', 'This will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await remove(ref(firebaseDB, `shared_rooms/${roomCode}/entries/${entryId}`));
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const handleEntryAction = (entry: SharedRoomEntry) => {
    Alert.alert('Entry Actions ⚙️', entry.description, [
      { text: 'Cancel', style: 'cancel' },
      { text: entry.isPaid ? 'Mark Pending' : 'Mark Settled ✅', onPress: () => togglePaid(entry) },
      { text: 'Edit ✏️', onPress: () => openEditModal(entry) },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const copyCode = () => {
    Alert.alert('Room Code 📋', roomCode);
  };

  const leaveRoom = () => {
    Alert.alert('Room Options ⚙️', 'You can leave this room (removes it locally) or delete it permanently from the cloud database for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave Room', onPress: async () => {
        await removeRoom(roomCode);
        router.back();
      }},
      { text: 'Delete from Database', style: 'destructive', onPress: async () => {
        Alert.alert('Delete Permanently? 🗑️', 'This will delete the room and all entries for all members. This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await remove(ref(firebaseDB, `shared_rooms/${roomCode}`));
              await removeRoom(roomCode);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete room from database');
            }
          }}
        ]);
      }},
    ]);
  };

  const memberList = Object.entries(members);
  const absBalance = Math.abs(myBalance);

  if (!localRoom) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>Room not found</Text>
        <Text style={{ fontSize: 14, color: theme.muted, textAlign: 'center' , fontFamily: 'Inter_500Medium'}}>This room is no longer in your local storage.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, borderRadius: 14, overflow: 'hidden' }}>
          <LinearGradient
            colors={theme.primaryGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' , fontFamily: 'Outfit_700Bold'}}>Go Back</Text>
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
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'Outfit_700Bold'}} numberOfLines={1}>{roomName} ☁️</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Cloud size={11} color={theme.primary} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary , fontFamily: 'Inter_700Bold'}}>Live Synced</Text>
              <Text style={{ fontSize: 11, color: theme.muted , fontFamily: 'Inter_500Medium'}}>•</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted , fontFamily: 'Inter_500Medium'}}>{roomCode}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={leaveRoom} activeOpacity={0.7}
          style={{ padding: 10, borderRadius: 14, backgroundColor: theme.danger + '12', borderWidth: 1, borderColor: theme.danger + '25' }}>
          <LogOut size={18} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.muted, marginTop: 12, fontWeight: '600' , fontFamily: 'Inter_500Medium'}}>Syncing...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Net Balance Card */}
          <View style={{
            backgroundColor: myBalance === 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : myBalance > 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : (isDark ? 'rgba(244,63,94,0.08)' : '#FFF1F2'),
            borderRadius: 24, padding: 24, marginBottom: 20,
            borderWidth: 1.5,
            borderColor: myBalance === 0 ? theme.success + '30' : myBalance > 0 ? theme.success + '30' : theme.danger + '30',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>
              Your Balance
            </Text>
            {myBalance === 0 ? (
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: theme.success , fontFamily: 'Outfit_700Bold'}}>All Settled! 🎉</Text>
                <Text style={{ fontSize: 14, color: theme.muted, fontWeight: '600', marginTop: 4 , fontFamily: 'Inter_500Medium'}}>No pending dues</Text>
              </View>
            ) : myBalance > 0 ? (
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>₹{absBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 14, color: theme.success, fontWeight: '700', marginTop: 4 , fontFamily: 'Inter_700Bold'}}>Others owe you 💰</Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: theme.danger, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>₹{absBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 14, color: theme.danger, fontWeight: '700', marginTop: 4 , fontFamily: 'Inter_700Bold'}}>You owe others 😅</Text>
              </View>
            )}
          </View>

          {/* Members */}
          <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={16} color={theme.primary} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Members ({memberList.length})</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={copyCode} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: theme.primary + '12' }}>
                <Copy size={12} color={theme.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary , fontFamily: 'Outfit_700Bold'}}>{roomCode}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {memberList.map(([id, m]) => {
                const isMe = id === myMemberId;
                return (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isMe ? theme.primary + '15' : theme.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: isMe ? theme.primary + '30' : theme.border }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isMe ? theme.primary : theme.success, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' , fontFamily: 'Outfit_700Bold'}}>{m.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isMe ? theme.primary : theme.ink , fontFamily: 'Inter_700Bold'}}>{m.name}{isMe ? ' (You)' : ''}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Entries Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Entries 📒</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.muted , fontFamily: 'Inter_700Bold'}}>Long press to manage</Text>
          </View>

          {/* Entry List */}
          {entries.length === 0 ? (
            <View style={{ backgroundColor: theme.card, borderRadius: 22, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 , fontFamily: 'Inter_500Medium'}}>📝</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.ink, marginBottom: 6 , fontFamily: 'Outfit_700Bold'}}>No entries yet</Text>
              <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'Inter_500Medium'}}>Tap + to add who paid for what</Text>
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
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 3, textDecorationLine: isPaid ? 'line-through' : 'none' , fontFamily: 'Inter_700Bold'}} numberOfLines={1}>{entry.description}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: entryColor + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: entryColor, textTransform: 'uppercase' , fontFamily: 'Outfit_700Bold'}}>
                            {entry.paidByName} paid
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted , fontFamily: 'Inter_500Medium'}}>
                          {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: entryColor, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>₹{entry.amount.toLocaleString('en-IN')}</Text>
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
        width: 58, height: 58, borderRadius: 29,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: theme.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12,
        overflow: 'hidden'
      }}>
        <LinearGradient
          colors={theme.primaryGradient}
          start={Gradients.diagonal.start}
          end={Gradients.diagonal.end}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={28} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 380 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>{editingId ? 'Edit Entry ✏️' : 'Add Entry 📝'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color={theme.muted} /></TouchableOpacity>
            </View>

            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>What was it for?</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 16, fontWeight: '600' }}
              placeholder="e.g. Groceries, Electricity"
              placeholderTextColor={theme.muted}
              value={formDesc}
              onChangeText={setFormDesc}
            />

            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Amount (₹)</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.success, fontSize: 28, fontWeight: '900', marginBottom: 16, fontVariant: ['tabular-nums'] }}
              placeholder="0"
              placeholderTextColor={theme.muted + '50'}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Date (YYYY-MM-DD)</Text>
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
                    <Text style={{ fontSize: 12, fontWeight: '700', color: formDate === val ? theme.primary : theme.muted , fontFamily: 'Inter_700Bold'}}>{label}</Text>
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
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'Outfit_700Bold'}}>{editingId ? 'Save Changes' : 'Add Entry'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
