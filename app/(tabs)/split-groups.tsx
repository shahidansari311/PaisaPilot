import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Users, Plus, ChevronRight, X, Cloud } from 'lucide-react-native';
import { SplitGroup } from '../../types/database';
import { useSharedRoomStore } from '../../store/useSharedRoomStore';

export default function SplitGroups() {
  const { isDark, accentColor } = useThemeStore();
  const db = useSQLiteContext();
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const { rooms, loadRooms, loaded: sharedLoaded } = useSharedRoomStore();

  useEffect(() => { if (!sharedLoaded) loadRooms(); }, []);

  // Group form
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const loadAll = async () => {
    try {
      setGroups(await db.getAllAsync<SplitGroup>('SELECT * FROM split_groups ORDER BY createdAt DESC'));
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

  // --- Group CRUD ---
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
  return (
    <View style={{ flex: 1, backgroundColor: bg , fontFamily: 'DMSans_500Medium'}}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20, backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: border , fontFamily: 'DMSans_500Medium'}}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: ink, letterSpacing: -1 , fontFamily: 'CormorantGaramond_700Bold'}}>Split 🍕</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: muted, marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>Share expenses with friends</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 , fontFamily: 'DMSans_500Medium'}} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* ============ SHARED ROOMS (CLOUD) SECTION ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 , fontFamily: 'DMSans_500Medium'}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 , fontFamily: 'DMSans_500Medium'}}>
            <Cloud size={18} color={accentColor} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Shared Rooms</Text>
            <View style={{ backgroundColor: accentColor + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 , fontFamily: 'DMSans_500Medium'}}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: accentColor , fontFamily: 'CormorantGaramond_700Bold'}}>LIVE</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/join-shared-room' as any)} activeOpacity={0.7}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor , fontFamily: 'DMSans_500Medium'}}>
            <Plus size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {rooms.length === 0 ? (
          <TouchableOpacity onPress={() => router.push('/join-shared-room' as any)} activeOpacity={0.8}
            style={{ backgroundColor: card, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed', marginBottom: 28 , fontFamily: 'DMSans_500Medium'}}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: raised, alignItems: 'center', justifyContent: 'center', marginBottom: 12 , fontFamily: 'DMSans_500Medium'}}>
              <Cloud size={24} color={muted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 4 , fontFamily: 'DMSans_700Bold'}}>No shared rooms</Text>
            <Text style={{ fontSize: 12, color: muted, textAlign: 'center', lineHeight: 18 , fontFamily: 'DMSans_500Medium'}}>
              Create or join a room to sync expenses with your roommate in real-time.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ marginBottom: 28 , fontFamily: 'DMSans_500Medium'}}>
            {rooms.map(room => (
              <TouchableOpacity
                key={room.roomCode}
                onPress={() => router.push({ pathname: '/shared-room', params: { code: room.roomCode } } as any)}
                activeOpacity={0.75}
                style={{ backgroundColor: card, borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14 , fontFamily: 'DMSans_500Medium'}}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: accentColor + '15', alignItems: 'center', justifyContent: 'center' , fontFamily: 'DMSans_500Medium'}}>
                  <Cloud size={20} color={accentColor} />
                </View>
                <View style={{ flex: 1 , fontFamily: 'DMSans_500Medium'}}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: ink , fontFamily: 'DMSans_700Bold'}}>{room.roomName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 , fontFamily: 'DMSans_500Medium'}}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor, backgroundColor: accentColor + '12', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 , fontFamily: 'DMSans_700Bold'}}>{room.roomCode}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: muted , fontFamily: 'DMSans_500Medium'}}>as {room.myName}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ============ SPLIT GROUPS SECTION ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 , fontFamily: 'DMSans_500Medium'}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 , fontFamily: 'DMSans_500Medium'}}>
            <Users size={18} color={accentColor} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>Split Groups</Text>
          </View>
          <TouchableOpacity onPress={() => { setIsAddingGroup(!isAddingGroup); if(isAddingGroup) { setEditingGroupId(null); setNewGroupName(''); } }} activeOpacity={0.7}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isAddingGroup ? raised : accentColor , fontFamily: 'DMSans_500Medium'}}>
            {isAddingGroup ? <X size={16} color={muted} /> : <Plus size={16} color="#fff" strokeWidth={2.5} />}
          </TouchableOpacity>
        </View>

        {isAddingGroup && (
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: accentColor + '40' , fontFamily: 'DMSans_500Medium'}}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: ink, marginBottom: 10 , fontFamily: 'CormorantGaramond_700Bold'}}>{editingGroupId ? 'Edit Group Name' : 'New Group'}</Text>
            <TextInput
              style={{ backgroundColor: raised, borderRadius: 18, padding: 12, color: ink, fontSize: 14, borderWidth: 1, borderColor: border, marginBottom: 12 , fontFamily: 'DMSans_500Medium'}}
              placeholder="e.g. Goa Trip, Roommates"
              placeholderTextColor={muted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={{ flexDirection: 'row', gap: 10 , fontFamily: 'DMSans_500Medium'}}>
              <TouchableOpacity onPress={() => { setIsAddingGroup(false); setEditingGroupId(null); setNewGroupName(''); }} activeOpacity={0.7}
                style={{ flex: 1, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: border, alignItems: 'center' , fontFamily: 'DMSans_500Medium'}}>
                <Text style={{ color: muted, fontWeight: '600' , fontFamily: 'DMSans_500Medium'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createGroup} activeOpacity={0.8}
                style={{ flex: 1, padding: 12, borderRadius: 18, alignItems: 'center', backgroundColor: accentColor , fontFamily: 'DMSans_500Medium'}}>
                <Text style={{ color: '#fff', fontWeight: '700' , fontFamily: 'DMSans_700Bold'}}>{editingGroupId ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {groups.length === 0 && !isAddingGroup ? (
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed', marginTop: 8 , fontFamily: 'DMSans_500Medium'}}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: raised, alignItems: 'center', justifyContent: 'center', marginBottom: 12 , fontFamily: 'DMSans_500Medium'}}>
              <Users size={24} color={muted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 4 , fontFamily: 'DMSans_700Bold'}}>No groups yet</Text>
            <Text style={{ fontSize: 12, color: muted, textAlign: 'center', lineHeight: 18 , fontFamily: 'DMSans_500Medium'}}>
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
              style={{ backgroundColor: card, borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14 , fontFamily: 'DMSans_500Medium'}}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: accentColor + '18', alignItems: 'center', justifyContent: 'center' , fontFamily: 'DMSans_500Medium'}}>
                <Users size={22} color={accentColor} />
              </View>
              <View style={{ flex: 1 , fontFamily: 'DMSans_500Medium'}}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: ink , fontFamily: 'DMSans_700Bold'}}>{group.name}</Text>
                <Text style={{ fontSize: 12, color: muted, marginTop: 2 , fontFamily: 'DMSans_500Medium'}}>Tap to view details</Text>
              </View>
              <ChevronRight size={18} color={muted} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 , fontFamily: 'DMSans_500Medium'}} />
      </ScrollView>
    </View>
  );
}
