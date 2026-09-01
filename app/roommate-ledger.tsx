import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Linking } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, X, Check, Edit2, Trash2, ArrowUpRight, ArrowDownLeft, CheckCircle, Circle, MessageCircle } from 'lucide-react-native';
import { RoommateLedger as LedgerType, RoommateEntry } from '../types/database';
import { useFocusEffect } from 'expo-router';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoommateLedgerDetail() {
  const { id } = useLocalSearchParams();
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;
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
  const roommateName = ledger?.name || 'Roommate';
  const absBalance = Math.abs(netBalance);

  if (!ledger) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink, letterSpacing: -0.5 , fontFamily: 'Outfit_700Bold'}}>{roommateName} 🏠</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.muted, marginTop: 2 , fontFamily: 'Inter_500Medium'}}>Roommate Ledger</Text>
          </View>
        </View>
        <TouchableOpacity onPress={shareViaWhatsApp} activeOpacity={0.75}
          style={{ backgroundColor: '#25D366' + '15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#25D366' + '30' }}>
          <MessageCircle size={16} color="#25D366" />
          <Text style={{ color: '#25D366', fontWeight: '800', fontSize: 13 , fontFamily: 'Outfit_700Bold'}}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Net Balance Hero Card */}
        <View style={{
          backgroundColor: netBalance === 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : netBalance > 0 ? (isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5') : (isDark ? 'rgba(244,63,94,0.08)' : '#FFF1F2'),
          borderRadius: 24, padding: 24, marginBottom: 24,
          borderWidth: 1.5,
          borderColor: netBalance === 0 ? theme.success + '30' : netBalance > 0 ? theme.success + '30' : theme.danger + '30',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 , fontFamily: 'Outfit_700Bold'}}>
            Net Balance
          </Text>
          {netBalance === 0 ? (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: theme.success , fontFamily: 'Outfit_700Bold'}}>All Settled! 🎉</Text>
              <Text style={{ fontSize: 14, color: theme.muted, fontWeight: '600', marginTop: 4 , fontFamily: 'Inter_500Medium'}}>No pending dues between you two</Text>
            </View>
          ) : netBalance > 0 ? (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
                ₹{absBalance.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 14, color: theme.success, fontWeight: '700', marginTop: 4 , fontFamily: 'Inter_700Bold'}}>
                {roommateName} owes you 💰
              </Text>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: theme.danger, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
                ₹{absBalance.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 14, color: theme.danger, fontWeight: '700', marginTop: 4 , fontFamily: 'Inter_700Bold'}}>
                You owe {roommateName} 😅
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ArrowUpRight size={14} color={theme.success} strokeWidth={2.5} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, textTransform: 'uppercase' , fontFamily: 'Outfit_700Bold'}}>You Paid</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: theme.success, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{entries.filter(e => e.paidBy === 'me' && !e.isPaid).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ArrowDownLeft size={14} color={theme.danger} strokeWidth={2.5} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, textTransform: 'uppercase' , fontFamily: 'Outfit_700Bold'}}>{roommateName} Paid</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: theme.danger, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{entries.filter(e => e.paidBy === 'roommate' && !e.isPaid).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </Text>
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
            <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'Inter_500Medium'}}>
              Tap + to add who paid for what
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: theme.card, borderRadius: 22, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
            {entries.map((entry, i) => {
              const isMe = entry.paidBy === 'me';
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
                  }}
                >
                  {/* Paid/Pending icon */}
                  <View style={{ marginRight: 12 }}>
                    {isPaid ? (
                      <CheckCircle size={22} color={theme.success} />
                    ) : (
                      <Circle size={22} color={theme.border} />
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
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 3, textDecorationLine: isPaid ? 'line-through' : 'none' , fontFamily: 'Inter_700Bold'}} numberOfLines={1}>
                      {entry.description}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ backgroundColor: entryColor + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: entryColor, textTransform: 'uppercase' , fontFamily: 'Outfit_700Bold'}}>
                          {isMe ? 'You paid' : `${roommateName} paid`}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted , fontFamily: 'Inter_500Medium'}}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <Text style={{ fontSize: 16, fontWeight: '900', color: entryColor, fontVariant: ['tabular-nums'] , fontFamily: 'Outfit_700Bold'}}>
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

      {/* Add/Edit Entry Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 420 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>{editingId ? 'Edit Entry ✏️' : 'Add Entry 📝'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={theme.muted} />
              </TouchableOpacity>
            </View>

            {/* Who Paid Toggle */}
            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Who paid?</Text>
            <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 5, flexDirection: 'row', borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}>
              {(['me', 'roommate'] as const).map(opt => {
                const active = formPaidBy === opt;
                const c = opt === 'me' ? theme.success : theme.danger;
                return (
                  <TouchableOpacity key={opt} onPress={() => setFormPaidBy(opt)} activeOpacity={0.8}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: active ? c : 'transparent' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: active ? '#fff' : theme.muted , fontFamily: 'Outfit_700Bold'}}>
                      {opt === 'me' ? 'I Paid 💸' : `${roommateName} Paid 🤝`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description */}
            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>What was it for?</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 16, fontWeight: '600' }}
              placeholder="e.g. Groceries, Electricity, Food"
              placeholderTextColor={theme.muted}
              value={formDesc}
              onChangeText={setFormDesc}
            />

            {/* Amount */}
            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Amount (₹)</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: formPaidBy === 'me' ? theme.success : theme.danger, fontSize: 28, fontWeight: '900', marginBottom: 16, fontVariant: ['tabular-nums'] }}
              placeholder="0"
              placeholderTextColor={theme.muted + '50'}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            {/* Date */}
            <Text style={{ color: theme.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 , fontFamily: 'Inter_700Bold'}}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 10, fontWeight: '600' }}
              placeholder="2026-07-21"
              placeholderTextColor={theme.muted}
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
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: formDate === val ? theme.primary : theme.border, backgroundColor: formDate === val ? theme.primary + '15' : theme.surface }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: formDate === val ? theme.primary : theme.muted , fontFamily: 'Inter_700Bold'}}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save */}
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
