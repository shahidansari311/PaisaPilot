import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Users, Plus, ChevronRight, X, Home, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { SplitGroup, RoommateLedger } from '../../types/database';

export default function SplitGroups() {
  const { isDark, accentColor } = useThemeStore();
  const db = useSQLiteContext();
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [ledgers, setLedgers] = useState<(RoommateLedger & { net: number })[]>([]);

  // Group form
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Ledger form
  const [isAddingLedger, setIsAddingLedger] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const loadAll = async () => {
    try {
      setGroups(await db.getAllAsync<SplitGroup>('SELECT * FROM split_groups ORDER BY createdAt DESC'));

      // Load ledgers with net balance
      const rawLedgers = await db.getAllAsync<RoommateLedger>('SELECT * FROM roommate_ledgers ORDER BY createdAt DESC');
      const withNet: (RoommateLedger & { net: number })[] = [];
      for (const l of rawLedgers) {
        const entries = await db.getAllAsync<{ paidBy: string; amount: number }>(
          "SELECT paidBy, amount FROM roommate_entries WHERE ledgerId = ? AND isPaid = 0", [l.id]
        );
        let net = 0;
        for (const e of entries) {
          net += e.paidBy === 'me' ? e.amount : -e.amount;
        }
        withNet.push({ ...l, net });
      }
      setLedgers(withNet);
    } catch (e) { console.error(e); }
  };

  // --- Group CRUD ---
  const createGroup = async () => {
    if (!newGroupName.trim()) { Alert.alert('Error', 'Group name is required'); return; }
    try {
      if (editingGroupId) {
        await db.runAsync('UPDATE split_groups SET name = ? WHERE id = ?', [newGroupName.trim(), editingGroupId]);
      } else {
        await db.runAsync('INSERT INTO split_groups (id, name, createdAt) VALUES (?, ?, ?)', [`grp-${Date.now()}`, newGroupName.trim(), new Date().toISOString()]);
      }
      setNewGroupName(''); setIsAddingGroup(false); setEditingGroupId(null); loadAll();
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to save group'); }
  };

  const deleteGroup = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM split_groups WHERE id = ?', [id]);
      loadAll();
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to delete group'); }
  };

  const handleGroupAction = (group: SplitGroup) => {
    Alert.alert('Group Actions ⚙️', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit Name', onPress: () => { setEditingGroupId(group.id); setNewGroupName(group.name); setIsAddingGroup(true); } },
      { text: 'Delete Group', style: 'destructive', onPress: () => {
        Alert.alert('Delete Group? 🗑️', 'This will remove all participants and expenses in this group.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(group.id) }
        ]);
      }}
    ]);
  };

  // --- Ledger CRUD ---
  const createLedger = async () => {
    if (!newLedgerName.trim()) { Alert.alert('Error', 'Roommate name is required'); return; }
    try {
      if (editingLedgerId) {
        await db.runAsync('UPDATE roommate_ledgers SET name = ? WHERE id = ?', [newLedgerName.trim(), editingLedgerId]);
      } else {
        await db.runAsync('INSERT INTO roommate_ledgers (id, name, createdAt) VALUES (?, ?, ?)', [`rl-${Date.now()}`, newLedgerName.trim(), new Date().toISOString()]);
      }
      setNewLedgerName(''); setIsAddingLedger(false); setEditingLedgerId(null); loadAll();
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to save ledger'); }
  };

  const deleteLedger = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM roommate_ledgers WHERE id = ?', [id]);
      loadAll();
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to delete ledger'); }
  };

  const handleLedgerAction = (ledger: RoommateLedger) => {
    Alert.alert('Ledger Actions ⚙️', ledger.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit Name', onPress: () => { setEditingLedgerId(ledger.id); setNewLedgerName(ledger.name); setIsAddingLedger(true); } },
      { text: 'Delete Ledger', style: 'destructive', onPress: () => {
        Alert.alert('Delete Ledger? 🗑️', 'This will remove all entries for this roommate.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteLedger(ledger.id) }
        ]);
      }}
    ]);
  };

  const bg = isDark ? '#0D1117' : '#F4F3F0';
  const card = isDark ? '#161B22' : '#FFFFFF';
  const raised = isDark ? '#1C2333' : '#F0EFEB';
  const border = isDark ? '#21262D' : '#E2E0DA';
  const ink = isDark ? '#E6EDF3' : '#1A1A2E';
  const muted = '#6E7681';
  const success = '#10B981';
  const danger = '#F43F5E';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20, backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: border }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: ink, letterSpacing: -1 }}>Split 🍕</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 }}>Share expenses with friends</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* ============ ROOMMATE LEDGERS SECTION ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Home size={18} color={accentColor} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: ink }}>Roommate Ledgers</Text>
          </View>
          <TouchableOpacity onPress={() => { setIsAddingLedger(!isAddingLedger); if(isAddingLedger) { setEditingLedgerId(null); setNewLedgerName(''); } }} activeOpacity={0.7}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isAddingLedger ? raised : accentColor }}>
            {isAddingLedger ? <X size={16} color={muted} /> : <Plus size={16} color="#fff" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        {isAddingLedger && (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: accentColor + '40' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: ink, marginBottom: 10 }}>{editingLedgerId ? 'Edit Roommate Name' : 'New Roommate Ledger'}</Text>
            <TextInput
              style={{ backgroundColor: raised, borderRadius: 12, padding: 12, color: ink, fontSize: 14, borderWidth: 1, borderColor: border, marginBottom: 12 }}
              placeholder="Roommate's name (e.g. Arjun)"
              placeholderTextColor={muted}
              value={newLedgerName}
              onChangeText={setNewLedgerName}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setIsAddingLedger(false); setEditingLedgerId(null); setNewLedgerName(''); }} activeOpacity={0.7}
                style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                <Text style={{ color: muted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createLedger} activeOpacity={0.8}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: accentColor }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{editingLedgerId ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {ledgers.length === 0 && !isAddingLedger ? (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed', marginBottom: 28 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: raised, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Home size={24} color={muted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 4 }}>No roommate ledgers</Text>
            <Text style={{ fontSize: 12, color: muted, textAlign: 'center', lineHeight: 18 }}>
              Track shared expenses with a roommate — who paid for what.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 28 }}>
            {ledgers.map(ledger => {
              const absNet = Math.abs(ledger.net);
              const netColor = ledger.net === 0 ? success : ledger.net > 0 ? success : danger;
              const netLabel = ledger.net === 0 ? 'Settled ✅' : ledger.net > 0 ? `Owes you ₹${absNet.toLocaleString('en-IN')}` : `You owe ₹${absNet.toLocaleString('en-IN')}`;

              return (
                <TouchableOpacity
                  key={ledger.id}
                  onPress={() => router.push({ pathname: '/roommate-ledger', params: { id: ledger.id } } as any)}
                  onLongPress={() => handleLedgerAction(ledger)}
                  delayLongPress={350}
                  activeOpacity={0.75}
                  style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: netColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: netColor }}>{ledger.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: ink }}>{ledger.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {ledger.net > 0 && <ArrowUpRight size={12} color={success} strokeWidth={2.5} />}
                      {ledger.net < 0 && <ArrowDownLeft size={12} color={danger} strokeWidth={2.5} />}
                      <Text style={{ fontSize: 13, fontWeight: '700', color: netColor }}>{netLabel}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ============ SPLIT GROUPS SECTION ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={18} color={accentColor} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: ink }}>Split Groups</Text>
          </View>
          <TouchableOpacity onPress={() => { setIsAddingGroup(!isAddingGroup); if(isAddingGroup) { setEditingGroupId(null); setNewGroupName(''); } }} activeOpacity={0.7}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isAddingGroup ? raised : accentColor }}>
            {isAddingGroup ? <X size={16} color={muted} /> : <Plus size={16} color="#fff" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        {isAddingGroup && (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: accentColor + '40' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: ink, marginBottom: 10 }}>{editingGroupId ? 'Edit Group Name' : 'New Group'}</Text>
            <TextInput
              style={{ backgroundColor: raised, borderRadius: 12, padding: 12, color: ink, fontSize: 14, borderWidth: 1, borderColor: border, marginBottom: 12 }}
              placeholder="e.g. Goa Trip, Roommates"
              placeholderTextColor={muted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setIsAddingGroup(false); setEditingGroupId(null); setNewGroupName(''); }} activeOpacity={0.7}
                style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                <Text style={{ color: muted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createGroup} activeOpacity={0.8}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: accentColor }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{editingGroupId ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {groups.length === 0 && !isAddingGroup ? (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed', marginTop: 8 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: raised, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Users size={24} color={muted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 4 }}>No groups yet</Text>
            <Text style={{ fontSize: 12, color: muted, textAlign: 'center', lineHeight: 18 }}>
              Create a group to split expenses with friends or roommates.
            </Text>
          </View>
        ) : (
          groups.map(group => (
            <TouchableOpacity
              key={group.id}
              onPress={() => router.push(`/group/${group.id}`)}
              onLongPress={() => handleGroupAction(group)}
              delayLongPress={350}
              activeOpacity={0.75}
              style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: accentColor + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: ink }}>{group.name}</Text>
                <Text style={{ fontSize: 12, color: muted, marginTop: 2 }}>Tap to view details</Text>
              </View>
              <ChevronRight size={18} color={muted} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
