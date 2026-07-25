import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Linking } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, X, Check, Edit2, Trash2, ArrowUpRight, ArrowDownLeft, CheckCircle, Circle, MessageCircle } from 'lucide-react-native';
import { RoommateLedger as LedgerType, RoommateEntry } from '../types/database';
import { useFocusEffect } from 'expo-router';

export default function RoommateLedgerDetail() {
  const { id } = useLocalSearchParams();
  const { isDark } = useThemeStore();
  const db = useSQLiteContext();

  const [ledger, setLedger] = useState<LedgerType | null>(null);
  const [entries, setEntries] = useState<RoommateEntry[]>([]);
  const [netBalance, setNetBalance] = useState(0); // positive = roommate owes you

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPaidBy, setFormPaidBy] = useState<'me' | 'roommate'>('me');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  useFocusEffect(useCallback(() => { if (id) loadData(); }, [id]));

  const loadData = async () => {
    try {
      const l = await db.getFirstAsync<LedgerType>('SELECT * FROM roommate_ledgers WHERE id = ?', [id as string]);
      if (l) setLedger(l);

      const e = await db.getAllAsync<RoommateEntry>(
        'SELECT * FROM roommate_entries WHERE ledgerId = ? ORDER BY date DESC, createdAt DESC',
        [id as string]
      );
      setEntries(e);

      // Calculate net balance (only pending entries)
      let net = 0;
      for (const entry of e) {
        if (entry.isPaid) continue;
        if (entry.paidBy === 'me') {
          net += entry.amount; // roommate owes me
        } else {
          net -= entry.amount; // I owe roommate
        }
      }
      setNetBalance(net);
    } catch (e) { console.error(e); }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormPaidBy('me');
    setFormAmount('');
    setFormDesc('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (entry: RoommateEntry) => {
    setEditingId(entry.id);
    setFormPaidBy(entry.paidBy);
    setFormAmount(entry.amount.toString());
    setFormDesc(entry.description);
    setFormDate(entry.date);
    setShowModal(true);
  };

  const saveEntry = async () => {
    const amt = parseFloat(formAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (!formDesc.trim()) { Alert.alert('Error', 'Description is required'); return; }
    if (!formDate.trim()) { Alert.alert('Error', 'Date is required'); return; }

    try {
      if (editingId) {
        await db.runAsync(
          'UPDATE roommate_entries SET paidBy = ?, amount = ?, description = ?, date = ? WHERE id = ?',
          [formPaidBy, amt, formDesc.trim(), formDate, editingId]
        );
      } else {
        const newId = `re-${Date.now()}`;
        await db.runAsync(
          'INSERT INTO roommate_entries (id, ledgerId, paidBy, amount, description, date, isPaid, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
          [newId, id as string, formPaidBy, amt, formDesc.trim(), formDate, new Date().toISOString()]
        );
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const togglePaid = async (entry: RoommateEntry) => {
    const newVal = entry.isPaid ? 0 : 1;
    const label = newVal ? 'Mark as Settled' : 'Mark as Pending';
    try {
      await db.runAsync('UPDATE roommate_entries SET isPaid = ? WHERE id = ?', [newVal, entry.id]);
      loadData();
    } catch (e) { Alert.alert('Error', 'Failed to update entry'); }
  };

  const deleteEntry = async (entryId: string) => {
    Alert.alert('Delete Entry? 🗑️', 'This entry will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await db.runAsync('DELETE FROM roommate_entries WHERE id = ?', [entryId]);
          loadData();
        } catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const handleEntryAction = (entry: RoommateEntry) => {
    Alert.alert('Entry Actions ⚙️', entry.description, [
      { text: 'Cancel', style: 'cancel' },
      { text: entry.isPaid ? 'Mark Pending' : 'Mark Settled ✅', onPress: () => togglePaid(entry) },
      { text: 'Edit ✏️', onPress: () => openEditModal(entry) },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const shareViaWhatsApp = () => {
    const pending = entries.filter(e => !e.isPaid);
    if (pending.length === 0) {
      Alert.alert('Nothing to Share', 'No pending entries to share.');
      return;
    }

    let msg = `🏠 *Roommate Ledger — ${roommateName}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    pending.forEach(e => {
      const who = e.paidBy === 'me' ? 'I' : roommateName;
      const dt = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      msg += `${who} paid ₹${e.amount.toLocaleString('en-IN')} — ${e.description} (${dt})\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (netBalance === 0) {
      msg += `✅ *All settled — no dues!*`;
    } else if (netBalance > 0) {
      msg += `💰 *${roommateName} owes ₹${Math.abs(netBalance).toLocaleString('en-IN')}*`;
    } else {
      msg += `😅 *I owe ${roommateName} ₹${Math.abs(netBalance).toLocaleString('en-IN')}*`;
    }
    msg += `\n\n_Sent from PaisaPilot 💸_`;

    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Alert.alert('WhatsApp Missing', 'We could not find WhatsApp on your phone.');
    }).catch(console.error);
  };
  const bg = isDark ? '#0D1B16' : '#F7F6F1';
  const card = isDark ? '#173229' : '#FFFFFF';
  const raised = isDark ? '#254A3D' : '#F7F6F1';
  const border = isDark ? '#254A3D' : '#E7E4DD';
  const ink = isDark ? '#F5F5F2' : '#173229';
  const muted = isDark ? '#6D9773' : '#60716A';
  const primary = isDark ? '#6D9773' : '#0C3B2E';
  const secondary = isDark ? '#0C3B2E' : '#6D9773';
  const accent = '#BB8A52';
  const highlight = '#FFBA00';
  const success = '#3A8F5A';
  const danger = '#C44D4D';
  const warning = '#D89B00';
  const roommateName = ledger?.name || 'Roommate';
  const absBalance = Math.abs(netBalance);

  if (!ledger) return <View style={{ flex: 1, backgroundColor: bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>{roommateName} 🏠</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: muted, marginTop: 2 , fontFamily: 'DMSans_500Medium'}}>Roommate Ledger</Text>
          </View>
        </View>
        <TouchableOpacity onPress={shareViaWhatsApp} activeOpacity={0.75}
          style={{ backgroundColor: '#25D366' + '15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#25D366' + '30' }}>
          <MessageCircle size={16} color="#25D366" />
          <Text style={{ color: '#25D366', fontWeight: '800', fontSize: 13 , fontFamily: 'CormorantGaramond_700Bold'}}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Net Balance Hero Card */}
        <View style={{
          backgroundColor: netBalance === 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : netBalance > 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : (isDark ? 'rgba(244,63,94,0.08)' : '#FFF1F2'),
          borderRadius: 24, padding: 24, marginBottom: 24,
          borderWidth: 1.5,
          borderColor: netBalance === 0 ? success + '30' : netBalance > 0 ? success + '30' : danger + '30',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 , fontFamily: 'CormorantGaramond_700Bold'}}>
            Net Balance
          </Text>
          {netBalance === 0 ? (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: success , fontFamily: 'CormorantGaramond_700Bold'}}>All Settled! 🎉</Text>
              <Text style={{ fontSize: 14, color: muted, fontWeight: '600', marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>No pending dues between you two</Text>
            </View>
          ) : netBalance > 0 ? (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                ₹{absBalance.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 14, color: success, fontWeight: '700', marginTop: 4 , fontFamily: 'DMSans_700Bold'}}>
                {roommateName} owes you 💰
              </Text>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                ₹{absBalance.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 14, color: danger, fontWeight: '700', marginTop: 4 , fontFamily: 'DMSans_700Bold'}}>
                You owe {roommateName} 😅
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ArrowUpRight size={14} color={success} strokeWidth={2.5} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: muted, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>You Paid</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: success, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{entries.filter(e => e.paidBy === 'me' && !e.isPaid).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ArrowDownLeft size={14} color={danger} strokeWidth={2.5} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: muted, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>{roommateName} Paid</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: danger, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{entries.filter(e => e.paidBy === 'roommate' && !e.isPaid).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Entries Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Entries 📒</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>Long press to manage</Text>
        </View>

        {/* Entry List */}
        {entries.length === 0 ? (
          <View style={{ backgroundColor: card, borderRadius: 22, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 36, marginBottom: 12 , fontFamily: 'DMSans_500Medium'}}>📝</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: ink, marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>No entries yet</Text>
            <Text style={{ fontSize: 13, color: muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'DMSans_500Medium'}}>
              Tap + to add who paid for what
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: card, borderRadius: 22, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
            {entries.map((entry, i) => {
              const isMe = entry.paidBy === 'me';
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
                  }}
                >
                  {/* Paid/Pending icon */}
                  <View style={{ marginRight: 12 }}>
                    {isPaid ? (
                      <CheckCircle size={22} color={success} />
                    ) : (
                      <Circle size={22} color={border} />
                    )}
                  </View>

                  {/* Who paid badge */}
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, marginRight: 12,
                    backgroundColor: entryColor + '15', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isMe ? (
                      <ArrowUpRight size={18} color={entryColor} strokeWidth={2.5} />
                    ) : (
                      <ArrowDownLeft size={18} color={entryColor} strokeWidth={2.5} />
                    )}
                  </View>

                  {/* Description + meta */}
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 3, textDecorationLine: isPaid ? 'line-through' : 'none' , fontFamily: 'DMSans_700Bold'}} numberOfLines={1}>
                      {entry.description}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ backgroundColor: entryColor + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: entryColor, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>
                          {isMe ? 'You paid' : `${roommateName} paid`}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <Text style={{ fontSize: 16, fontWeight: '900', color: entryColor, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                    ₹{entry.amount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity onPress={openAddModal} activeOpacity={0.85} style={{
        position: 'absolute', bottom: 32, right: 20,
        width: 58, height: 58, borderRadius: 29,
        backgroundColor: primary, alignItems: 'center', justifyContent: 'center',
        shadowColor: primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12,
      }}>
        <Plus size={28} color="#fff" strokeWidth={3} />
      </TouchableOpacity>

      {/* Add/Edit Entry Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 420 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>{editingId ? 'Edit Entry ✏️' : 'Add Entry 📝'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={muted} />
              </TouchableOpacity>
            </View>

            {/* Who Paid Toggle */}
            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Who paid?</Text>
            <View style={{ backgroundColor: raised, borderRadius: 18, padding: 5, flexDirection: 'row', borderWidth: 1, borderColor: border, marginBottom: 20 }}>
              {(['me', 'roommate'] as const).map(opt => {
                const active = formPaidBy === opt;
                const c = opt === 'me' ? success : danger;
                return (
                  <TouchableOpacity key={opt} onPress={() => setFormPaidBy(opt)} activeOpacity={0.8}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: active ? c : 'transparent' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: active ? '#fff' : muted , fontFamily: 'CormorantGaramond_700Bold'}}>
                      {opt === 'me' ? 'I Paid 💸' : `${roommateName} Paid 🤝`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description */}
            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>What was it for?</Text>
            <TextInput
              style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: ink, fontSize: 16, marginBottom: 16, fontWeight: '600' }}
              placeholder="e.g. Groceries, Electricity, Food"
              placeholderTextColor={muted}
              value={formDesc}
              onChangeText={setFormDesc}
            />

            {/* Amount */}
            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Amount (₹)</Text>
            <TextInput
              style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: formPaidBy === 'me' ? success : danger, fontSize: 28, fontWeight: '900', marginBottom: 16, fontVariant: ['tabular-nums'] }}
              placeholder="0"
              placeholderTextColor={isDark ? '#334155' : '#CBD5E1'}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            {/* Date */}
            <Text style={{ color: muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_700Bold'}}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 14, color: ink, fontSize: 16, marginBottom: 10, fontWeight: '600' }}
              placeholder="2026-07-21"
              placeholderTextColor={muted}
              value={formDate}
              onChangeText={setFormDate}
            />
            {/* Quick date shortcuts */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Today', offset: 0 },
                { label: 'Yesterday', offset: -1 },
                { label: '2 days ago', offset: -2 },
                { label: '1 week ago', offset: -7 },
              ].map(({ label, offset }) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const val = d.toISOString().split('T')[0];
                return (
                  <TouchableOpacity key={label} onPress={() => setFormDate(val)} activeOpacity={0.7}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: formDate === val ? primary : border, backgroundColor: formDate === val ? primary + '15' : raised }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: formDate === val ? primary : muted , fontFamily: 'DMSans_700Bold'}}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save */}
            <TouchableOpacity onPress={saveEntry} activeOpacity={0.85}
              style={{ backgroundColor: primary, padding: 18, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <Check size={22} color="#fff" strokeWidth={3} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' , fontFamily: 'CormorantGaramond_700Bold'}}>{editingId ? 'Save Changes' : 'Add Entry'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
