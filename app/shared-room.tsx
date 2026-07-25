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

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const raised = isDark ? '#334155' : '#F1F5F9';
  const border = isDark ? '#334155' : '#E2E8F0';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const primary = '#8B5CF6';
  const success = '#10B981';
  const danger = '#F43F5E';

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
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: ink, marginBottom: 8 }}>Room not found</Text>
        <Text style={{ fontSize: 14, color: muted, textAlign: 'center' }}>This room is no longer in your local storage.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: primary }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: ink, letterSpacing: -0.5 }} numberOfLines={1}>{roomName} ☁️</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Cloud size={11} color={primary} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: primary }}>Live Synced</Text>
              <Text style={{ fontSize: 11, color: muted }}>•</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: muted }}>{roomCode}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={leaveRoom} activeOpacity={0.7}
          style={{ padding: 10, borderRadius: 14, backgroundColor: danger + '12', borderWidth: 1, borderColor: danger + '25' }}>
          <LogOut size={18} color={danger} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={primary} />
          <Text style={{ color: muted, marginTop: 12, fontWeight: '600' }}>Syncing...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Net Balance Card */}
          <View style={{
            backgroundColor: myBalance === 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : myBalance > 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : (isDark ? 'rgba(244,63,94,0.08)' : '#FFF1F2'),
            borderRadius: 24, padding: 24, marginBottom: 20,
            borderWidth: 1.5,
            borderColor: myBalance === 0 ? success + '30' : myBalance > 0 ? success + '30' : danger + '30',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Your Balance
            </Text>
            {myBalance === 0 ? (
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: success }}>All Settled! 🎉</Text>
                <Text style={{ fontSize: 14, color: muted, fontWeight: '600', marginTop: 4 }}>No pending dues</Text>
              </View>
            ) : myBalance > 0 ? (
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] }}>₹{absBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 14, color: success, fontWeight: '700', marginTop: 4 }}>Others owe you 💰</Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: danger, fontVariant: ['tabular-nums'] }}>₹{absBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 14, color: danger, fontWeight: '700', marginTop: 4 }}>You owe others 😅</Text>
              </View>
            )}
          </View>

          {/* Members */}
          <View style={{ backgroundColor: card, borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={16} color={primary} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: ink }}>Members ({memberList.length})</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={copyCode} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: primary + '12' }}>
                <Copy size={12} color={primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: primary }}>{roomCode}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {memberList.map(([id, m]) => {
                const isMe = id === myMemberId;
                return (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isMe ? primary + '15' : raised, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: isMe ? primary + '30' : border }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isMe ? primary : success, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' }}>{m.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isMe ? primary : ink }}>{m.name}{isMe ? ' (You)' : ''}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Entries Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: ink }}>Entries 📒</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: muted }}>Long press to manage</Text>
          </View>

          {/* Entry List */}
          {entries.length === 0 ? (
            <View style={{ backgroundColor: card, borderRadius: 22, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📝</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: ink, marginBottom: 6 }}>No entries yet</Text>
              <Text style={{ fontSize: 13, color: muted, textAlign: 'center', lineHeight: 20 }}>Tap + to add who paid for what</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: card, borderRadius: 22, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
              {entries.map((entry, i) => {
                const isMe = entry.paidByMemberId === myMemberId;
                const isPaid = !!entry.isPaid;
                const entryColor = isMe ? success : danger;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => togglePaid(entry)}
                    onLongPress={() => handleEntryAction(entry)}
                    delayLongPress={350}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
                      borderBottomWidth: i < entries.length - 1 ? 1 : 0, borderBottomColor: border,
                      opacity: isPaid ? 0.45 : 1,
                    }}>
                    <View style={{ marginRight: 12 }}>
                      {isPaid ? <CheckCircle size={22} color={success} /> : <Circle size={22} color={border} />}
                    </View>
                    <View style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: entryColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                      {isMe ? <ArrowUpRight size={18} color={entryColor} strokeWidth={2.5} /> : <ArrowDownLeft size={18} color={entryColor} strokeWidth={2.5} />}
                    </View>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 3, textDecorationLine: isPaid ? 'line-through' : 'none' }} numberOfLines={1}>{entry.description}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: entryColor + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: entryColor, textTransform: 'uppercase' }}>
                            {entry.paidByName} paid
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: muted }}>
                          {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: entryColor, fontVariant: ['tabular-nums'] }}>₹{entry.amount.toLocaleString('en-IN')}</Text>
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
        backgroundColor: primary, alignItems: 'center', justifyContent: 'center',
        shadowColor: primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12,
      }}>
        <Plus size={28} color="#fff" strokeWidth={3} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 380 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: ink }}>{editingId ? 'Edit Entry ✏️' : 'Add Entry 📝'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color={muted} /></TouchableOpacity>
            </View>

            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 }}>What was it for?</Text>
            <TextInput
              style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: ink, fontSize: 16, marginBottom: 16, fontWeight: '600' }}
              placeholder="e.g. Groceries, Electricity"
              placeholderTextColor={muted}
              value={formDesc}
              onChangeText={setFormDesc}
            />

            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 }}>Amount (₹)</Text>
            <TextInput
              style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: success, fontSize: 28, fontWeight: '900', marginBottom: 16, fontVariant: ['tabular-nums'] }}
              placeholder="0"
              placeholderTextColor={isDark ? '#334155' : '#CBD5E1'}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 }}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: ink, fontSize: 16, marginBottom: 10, fontWeight: '600' }}
              placeholder="2026-07-21"
              placeholderTextColor={muted}
              value={formDate}
              onChangeText={setFormDate}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {[{ label: 'Today', offset: 0 }, { label: 'Yesterday', offset: -1 }, { label: '2 days ago', offset: -2 }].map(({ label, offset }) => {
                const d = new Date(); d.setDate(d.getDate() + offset);
                const val = d.toISOString().split('T')[0];
                return (
                  <TouchableOpacity key={label} onPress={() => setFormDate(val)} activeOpacity={0.7}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: formDate === val ? primary : border, backgroundColor: formDate === val ? primary + '15' : raised }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: formDate === val ? primary : muted }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={saveEntry} activeOpacity={0.85}
              style={{ backgroundColor: primary, padding: 18, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <Check size={22} color="#fff" strokeWidth={3} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{editingId ? 'Save Changes' : 'Add Entry'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
