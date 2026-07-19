import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Users, Plus, ChevronRight, X } from 'lucide-react-native';
import { SplitGroup } from '../../types/database';

export default function SplitGroups() {
  const { isDark, accentColor } = useThemeStore();
  const db = useSQLiteContext();
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try { setGroups(await db.getAllAsync<SplitGroup>('SELECT * FROM split_groups ORDER BY createdAt DESC')); }
    catch (e) { console.error(e); }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) { Alert.alert('Error', 'Group name is required'); return; }
    try {
      if (editingGroupId) {
        await db.runAsync('UPDATE split_groups SET name = ? WHERE id = ?', [newGroupName.trim(), editingGroupId]);
      } else {
        await db.runAsync('INSERT INTO split_groups (id, name, createdAt) VALUES (?, ?, ?)', [`grp-${Date.now()}`, newGroupName.trim(), new Date().toISOString()]);
      }
      setNewGroupName(''); setIsAdding(false); setEditingGroupId(null); loadGroups();
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to save group'); }
  };

  const deleteGroup = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM split_groups WHERE id = ?', [id]);
      loadGroups();
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to delete group'); }
  };

  const handleAction = (group: SplitGroup) => {
    Alert.alert('Group Actions ⚙️', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit Name', onPress: () => { setEditingGroupId(group.id); setNewGroupName(group.name); setIsAdding(true); } },
      { text: 'Delete Group', style: 'destructive', onPress: () => {
        Alert.alert('Delete Group? 🗑️', 'This will remove all participants and expenses in this group.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(group.id) }
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

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20, backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: border }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: ink, letterSpacing: -1 }}>Split 🍕</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 }}>Share expenses with friends</Text>
        </View>
        <TouchableOpacity onPress={() => { setIsAdding(!isAdding); if(isAdding) { setEditingGroupId(null); setNewGroupName(''); } }} activeOpacity={0.7}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: isAdding ? raised : accentColor }}>
          {isAdding ? <X size={20} color={muted} /> : <Plus size={20} color="#fff" strokeWidth={2.5} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {isAdding && (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: accentColor + '40' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: ink, marginBottom: 12 }}>{editingGroupId ? 'Edit Group Name' : 'New Group'}</Text>
            <TextInput
              style={{ backgroundColor: raised, borderRadius: 12, padding: 12, color: ink, fontSize: 14, borderWidth: 1, borderColor: border, marginBottom: 12 }}
              placeholder="e.g. Goa Trip, Roommates"
              placeholderTextColor={muted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setIsAdding(false); setEditingGroupId(null); setNewGroupName(''); }} activeOpacity={0.7}
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

        {groups.length === 0 && !isAdding ? (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: border, marginTop: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: raised, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Users size={28} color={muted} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: ink, marginBottom: 6 }}>No groups yet</Text>
            <Text style={{ fontSize: 13, color: muted, textAlign: 'center', lineHeight: 20 }}>
              Create a group to split expenses with friends or roommates.
            </Text>
          </View>
        ) : (
          groups.map(group => (
            <TouchableOpacity
              key={group.id}
              onPress={() => router.push(`/group/${group.id}`)}
              onLongPress={() => handleAction(group)}
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
