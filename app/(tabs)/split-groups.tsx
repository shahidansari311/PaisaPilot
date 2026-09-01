import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Users, Plus, ChevronRight, X, Cloud } from 'lucide-react-native';
import { SplitGroup } from '../../types/database';
import { useSharedRoomStore } from '../../store/useSharedRoomStore';
import { Colors, Gradients } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplitGroups() {
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: theme.ink, letterSpacing: -1 , fontFamily: 'Outfit_700Bold'}}>Split 🍕</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.muted, marginTop: 4 , fontFamily: 'Inter_500Medium'}}>Share expenses with friends</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* ============ SHARED ROOMS (CLOUD) SECTION ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Cloud size={18} color={theme.primary} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Shared Rooms</Text>
            <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primary , fontFamily: 'Outfit_700Bold'}}>LIVE</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/join-shared-room' as any)} activeOpacity={0.7}
            style={{ shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <LinearGradient
              colors={theme.primaryGradient}
              start={Gradients.diagonal.start}
              end={Gradients.diagonal.end}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={16} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {rooms.length === 0 ? (
          <TouchableOpacity onPress={() => router.push('/join-shared-room' as any)} activeOpacity={0.8}
            style={{ backgroundColor: theme.card, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', marginBottom: 28 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Cloud size={24} color={theme.muted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 4 , fontFamily: 'Inter_700Bold'}}>No shared rooms</Text>
            <Text style={{ fontSize: 12, color: theme.muted, textAlign: 'center', lineHeight: 18 , fontFamily: 'Inter_500Medium'}}>
              Create or join a room to sync expenses with your roommate in real-time.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ marginBottom: 28 }}>
            {rooms.map(room => (
              <TouchableOpacity
                key={room.roomCode}
                onPress={() => router.push({ pathname: '/shared-room', params: { code: room.roomCode } } as any)}
                activeOpacity={0.75}
                style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Cloud size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink , fontFamily: 'Inter_700Bold'}}>{room.roomName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary, backgroundColor: theme.primary + '12', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 , fontFamily: 'Inter_700Bold'}}>{room.roomCode}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.muted , fontFamily: 'Inter_500Medium'}}>as {room.myName}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={theme.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ============ SPLIT GROUPS SECTION ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={18} color={theme.primary} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Split Groups</Text>
          </View>
          <TouchableOpacity onPress={() => { setIsAddingGroup(!isAddingGroup); if(isAddingGroup) { setEditingGroupId(null); setNewGroupName(''); } }} activeOpacity={0.7}
            style={{ shadowColor: theme.primary, shadowOpacity: isAddingGroup ? 0 : 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: isAddingGroup ? 0 : 4 }}>
            {isAddingGroup ? (
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }}>
                <X size={16} color={theme.muted} />
              </View>
            ) : (
              <LinearGradient
                colors={theme.primaryGradient}
                start={Gradients.diagonal.start}
                end={Gradients.diagonal.end}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={16} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {isAddingGroup && (
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.primary + '40' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ink, marginBottom: 10 , fontFamily: 'Outfit_700Bold'}}>{editingGroupId ? 'Edit Group Name' : 'New Group'}</Text>
            <TextInput
              style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 12, color: theme.ink, fontSize: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 12 }}
              placeholder="e.g. Goa Trip, Roommates"
              placeholderTextColor={theme.muted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setIsAddingGroup(false); setEditingGroupId(null); setNewGroupName(''); }} activeOpacity={0.7}
                style={{ flex: 1, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                <Text style={{ color: theme.muted, fontWeight: '600' , fontFamily: 'Inter_500Medium'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createGroup} activeOpacity={0.8}
                style={{ flex: 1, borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient
                  colors={theme.primaryGradient}
                  start={Gradients.diagonal.start}
                  end={Gradients.diagonal.end}
                  style={{ padding: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' , fontFamily: 'Inter_700Bold'}}>{editingGroupId ? 'Save' : 'Create'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {groups.length === 0 && !isAddingGroup ? (
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', marginTop: 8 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Users size={24} color={theme.muted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 4 , fontFamily: 'Inter_700Bold'}}>No groups yet</Text>
            <Text style={{ fontSize: 12, color: theme.muted, textAlign: 'center', lineHeight: 18 , fontFamily: 'Inter_500Medium'}}>
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
              style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink , fontFamily: 'Inter_700Bold'}}>{group.name}</Text>
                <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 , fontFamily: 'Inter_500Medium'}}>Tap to view details</Text>
              </View>
              <ChevronRight size={18} color={theme.muted} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
