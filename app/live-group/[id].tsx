import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, UserPlus, Receipt, Trash2, Edit2, Check, X, Users, ChevronDown, Share, Cloud, LogOut, WifiOff, Wifi } from 'lucide-react-native';
import { supabase } from '../../config/supabaseConfig';
import { LiveSplitGroup, LiveSplitMember, LiveSplitExpense } from '../../types/database';
import { useLiveSplitStore } from '../../store/useLiveSplitStore';
import { Colors } from '../../constants/Colors';
import * as Linking from 'expo-linking';
import { isInternetReachable } from '../../utils/network';

export default function LiveGroupDetails() {
  const { id } = useLocalSearchParams();
  const roomCode = id as string;
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;
  const accentColor = theme.primary;
  
  const { getGroupById, removeGroup, getCachedGroup, setCachedGroup, loadCache } = useLiveSplitStore();
  const localInfo = getGroupById(roomCode);

  const [group, setGroup] = useState<LiveSplitGroup | null>(null);
  const [participants, setParticipants] = useState<LiveSplitMember[]>([]);
  const [expenses, setExpenses] = useState<LiveSplitExpense[]>([]);
  const [settlements, setSettlements] = useState<{from: string; to: string; amount: number}[]>([]);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Modals & Forms
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expPayerId, setExpPayerId] = useState('');
  const [includedMembers, setIncludedMembers] = useState<string[]>([]);
  const [savingExpense, setSavingExpense] = useState(false);

  const myMemberId = localInfo?.myMemberId || '';
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchData = async () => {
    try {
      const { data: g } = await supabase.from('live_split_groups').select('*').eq('id', roomCode).single();
      if (g) setGroup(g);
      
      const { data: parts } = await supabase.from('live_split_members').select('*').eq('group_id', roomCode);
      const partList = parts || [];
      setParticipants(partList);
      
      const { data: exps } = await supabase.from('live_split_expenses').select('*').eq('group_id', roomCode).order('created_at', { ascending: false });
      const expList = exps || [];
      setExpenses(expList);
      if (parts) calculateSettlements(partList, expList);

      // Update cache
      const now = new Date().toISOString();
      setLastSynced(now);
      await setCachedGroup(roomCode, {
        groupName: g?.name || localInfo?.groupName || '',
        participants: partList,
        expenses: expList,
        lastSynced: now,
      });
    } catch (e) { console.error(e); }
  };

  // ── Init: load cache, check network, subscribe realtime ──
  useEffect(() => {
    if (!roomCode) return;

    const init = async () => {
      // Load cache for instant offline display
      await loadCache();
      const cached = getCachedGroup(roomCode);
      if (cached) {
        setParticipants(cached.participants || []);
        setExpenses(cached.expenses || []);
        setLastSynced(cached.lastSynced || null);
        calculateSettlements(cached.participants || [], cached.expenses || []);
        setLoading(false); // Show cached immediately
      }

      // Check connectivity
      const online = await isInternetReachable();
      setIsOnline(online);

      if (online) {
        await fetchData();
        subscribeRealtime();
      }
      setLoading(false);
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
        setIsOnline(true);
        await fetchData();
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
    const channel = supabase.channel(`live_room_${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_split_members', filter: `group_id=eq.${roomCode}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_split_expenses', filter: `group_id=eq.${roomCode}` }, () => fetchData())
      .subscribe();
    channelRef.current = channel;
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
    fetchData().finally(() => setRefreshing(false));
  };

  const calculateSettlements = (parts: LiveSplitMember[], exps: LiveSplitExpense[]) => {
    if (parts.length === 0 || exps.length === 0) { setSettlements([]); return; }
    const balances: Record<string, number> = {};
    parts.forEach(p => balances[p.id] = 0);

    for (const exp of exps) {
      if (balances[exp.paid_by_member_id] !== undefined) {
        balances[exp.paid_by_member_id] += Number(exp.total_amount);
      }
      
      const included = exp.split_between_ids || [];
      if (included.length > 0) {
        const splitAmount = Number(exp.total_amount) / included.length;
        for (const pId of included) {
          if (balances[pId] !== undefined) {
            balances[pId] -= splitAmount;
          }
        }
      }
    }

    const debtors = Object.keys(balances).filter(k => balances[k] < -0.01).map(k => ({ id: k, amount: -balances[k] })).sort((a,b) => b.amount - a.amount);
    const creditors = Object.keys(balances).filter(k => balances[k] > 0.01).map(k => ({ id: k, amount: balances[k] })).sort((a,b) => b.amount - a.amount);
    
    const results: {from: string; to: string; amount: number}[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
      const fromName = parts.find(p => p.id === debtors[i].id)?.name || 'Unknown';
      const toName = parts.find(p => p.id === creditors[j].id)?.name || 'Unknown';
      
      results.push({ from: fromName, to: toName, amount: settleAmount });
      
      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;
      
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
    setSettlements(results);
  };

  const handleShareWhatsApp = () => {
    if (!group) return;
    const msg = `Join my Live Split Group "${group.name}" on PaisaPilot! \n\nUse Code: *${roomCode}*\n\nLet's split our expenses easily.`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Alert.alert('Error', 'WhatsApp is not installed on this device');
    });
  };

  const leaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        const online = await isInternetReachable();
        if (!online) { Alert.alert('You\'re Offline', 'Connect to the internet to leave the group.'); return; }
        try {
          await supabase.from('live_split_members').delete().eq('id', myMemberId);
          await removeGroup(roomCode);
          router.back();
        } catch (e) {
          Alert.alert('Error', 'Failed to leave group');
        }
      }}
    ]);
  };

  // Expense Actions
  const openAddExpense = async () => {
    const online = await isInternetReachable();
    if (!online) {
      Alert.alert('You\'re Offline', 'Connect to the internet to add expenses.');
      return;
    }
    setEditingExpenseId(null);
    setExpAmount('');
    setExpDesc('');
    setExpPayerId(myMemberId);
    setIncludedMembers(participants.map(p => p.id));
    setShowExpenseModal(true);
  };

  const addExpense = async () => {
    const online = await isInternetReachable();
    if (!online) {
      Alert.alert('You\'re Offline', 'Connect to the internet to save expenses.');
      return;
    }

    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0 || !expDesc.trim() || !expPayerId) { Alert.alert('Error', 'Please fill all fields'); return; }
    if (includedMembers.length === 0) { Alert.alert('Wait!', 'At least one member must be included in the split.'); return; }
    
    setSavingExpense(true);
    try {
      if (editingExpenseId) {
        await supabase.from('live_split_expenses').update({
          paid_by_member_id: expPayerId,
          total_amount: amt,
          description: expDesc.trim(),
          split_between_ids: includedMembers
        }).eq('id', editingExpenseId);
      } else {
        await supabase.from('live_split_expenses').insert({
          group_id: roomCode,
          paid_by_member_id: expPayerId,
          total_amount: amt,
          description: expDesc.trim(),
          split_between_ids: includedMembers
        });
      }
      
      setShowExpenseModal(false); setExpAmount(''); setExpDesc(''); setExpPayerId(''); setEditingExpenseId(null); setIncludedMembers([]);
    } catch (e) { 
      Alert.alert('Error', 'Failed to save expense'); 
    } finally {
      setSavingExpense(false);
    }
  };

  const handleExpenseAction = (exp: LiveSplitExpense) => {
    Alert.alert('Expense Actions', exp.description, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => {
          setEditingExpenseId(exp.id);
          setExpAmount(exp.total_amount.toString());
          setExpDesc(exp.description);
          setExpPayerId(exp.paid_by_member_id);
          setIncludedMembers(exp.split_between_ids || []);
          setShowExpenseModal(true);
      }},
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(exp.id) }
    ]);
  };

  const deleteExpense = (expId: string) => {
    Alert.alert('Delete Expense', 'This will remove the expense for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const online = await isInternetReachable();
          if (!online) { Alert.alert('You\'re Offline', 'Connect to the internet to delete expenses.'); return; }
          await supabase.from('live_split_expenses').delete().eq('id', expId);
      }}
    ]);
  };

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!localInfo) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.ink, fontFamily: 'FjallaOne_400Regular' }}>Group not found locally.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: accentColor, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontFamily: 'FjallaOne_400Regular' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink, fontFamily: 'FjallaOne_400Regular' }} numberOfLines={1}>{group?.name || localInfo?.groupName || 'Loading...'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {isOnline ? (
                <>
                  <Wifi size={12} color={theme.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary, fontFamily: 'FjallaOne_400Regular' }}>{roomCode}</Text>
                </>
              ) : (
                <>
                  <WifiOff size={12} color={theme.danger} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.danger, fontFamily: 'FjallaOne_400Regular' }}>Offline</Text>
                  {lastSynced && (
                    <Text style={{ fontSize: 11, color: theme.muted, fontFamily: 'FjallaOne_400Regular' }}>• cached {formatSyncTime(lastSynced)}</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={handleShareWhatsApp} activeOpacity={0.7} style={{ padding: 8, backgroundColor: '#25D366' + '20', borderRadius: 20, marginRight: 8 }}>
          <Share size={18} color="#25D366" />
        </TouchableOpacity>
        <TouchableOpacity onPress={leaveGroup} activeOpacity={0.7} style={{ padding: 8, backgroundColor: theme.danger + '15', borderRadius: 20 }}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
          
          {/* Settlements Summary */}
          {settlements.length > 0 && (
            <View style={{ backgroundColor: accentColor + '10', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: accentColor + '40', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Users size={18} color={accentColor} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: accentColor, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'FjallaOne_400Regular' }}>Who owes who?</Text>
              </View>
              {settlements.map((s, i) => {
                const isReceiving = s.to === localInfo.myName;
                const isPaying = s.from === localInfo.myName;
                const settleColor = isReceiving ? theme.success : isPaying ? theme.danger : theme.ink;
                return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < settlements.length -1 ? 1 : 0, borderBottomColor: accentColor + '20' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.ink, fontFamily: 'FjallaOne_400Regular' }}>{isPaying ? 'You' : s.from} <Text style={{ color: theme.muted, fontWeight: '400', fontFamily: 'FjallaOne_400Regular' }}>give</Text> {isReceiving ? 'You' : s.to}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: settleColor, fontFamily: 'FjallaOne_400Regular' }}>₹{s.amount.toFixed(2)}</Text>
                </View>
                );
              })}
            </View>
          )}

          {/* Participants */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'FjallaOne_400Regular' }}>Participants</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {participants.length === 0 ? (
              <Text style={{ color: theme.muted, fontStyle: 'italic', fontSize: 13, fontFamily: 'FjallaOne_400Regular' }}>No participants yet.</Text>
            ) : (
              participants.map(p => (
                <View key={p.id} style={{ backgroundColor: p.id === myMemberId ? accentColor + '18' : theme.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: p.id === myMemberId ? accentColor + '40' : theme.border }}>
                  <Text style={{ fontWeight: '600', color: p.id === myMemberId ? accentColor : theme.ink, fontSize: 13, fontFamily: 'FjallaOne_400Regular' }}>{p.name} {p.id === myMemberId && '(You)'}</Text>
                </View>
              ))
            )}
          </View>

          {/* Expenses */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'FjallaOne_400Regular' }}>Expenses</Text>
            <TouchableOpacity onPress={openAddExpense} activeOpacity={0.7}>
              <Receipt size={20} color={isOnline ? accentColor : theme.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: theme.card, borderRadius: 24, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
            {expenses.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Receipt size={26} color={theme.muted} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 6, fontFamily: 'FjallaOne_400Regular' }}>No expenses yet</Text>
                <Text style={{ color: theme.muted, textAlign: 'center', fontSize: 13, lineHeight: 20, fontFamily: 'FjallaOne_400Regular' }}>
                  Tap the receipt icon to add an expense.
                </Text>
              </View>
            ) : (
              expenses.map((exp, i) => {
                const payer = participants.find(p => p.id === exp.paid_by_member_id)?.name || 'Unknown';
                return (
                  <TouchableOpacity key={exp.id} onPress={() => setExpandedExpenseId(expandedExpenseId === exp.id ? null : exp.id)} onLongPress={() => handleExpenseAction(exp)} delayLongPress={300} activeOpacity={0.7}
                    style={{ padding: 16, borderBottomWidth: i < expenses.length -1 ? 1 : 0, borderBottomColor: theme.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 2, fontFamily: 'FjallaOne_400Regular' }}>{exp.description}</Text>
                        <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'FjallaOne_400Regular' }}>Paid by {payer === localInfo.myName ? 'You' : payer}</Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.ink, fontFamily: 'FjallaOne_400Regular' }}>₹{exp.total_amount}</Text>
                    </View>
                    
                    {expandedExpenseId === exp.id && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border + '50' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'FjallaOne_400Regular' }}>Split between</Text>
                        {exp.split_between_ids?.map(pId => {
                          const pName = participants.find(p => p.id === pId)?.name || 'Unknown';
                          const splitAmount = Number(exp.total_amount) / (exp.split_between_ids.length || 1);
                          return (
                            <View key={pId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <Text style={{ fontSize: 14, color: theme.ink, fontWeight: '500', fontFamily: 'FjallaOne_400Regular' }}>{pName === localInfo.myName ? 'You' : pName}</Text>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.muted, fontFamily: 'FjallaOne_400Regular' }}>₹{splitAmount.toFixed(2)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add Expense Modal with KeyboardAvoidingView configured for nested scroll */}
      <Modal visible={showExpenseModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <TouchableOpacity activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowExpenseModal(false)}>
            <TouchableOpacity activeOpacity={1} style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink, fontFamily: 'FjallaOne_400Regular' }}>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
                <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                  <X size={24} color={theme.muted} />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={{ color: theme.muted, fontWeight: '600', marginBottom: 8, fontSize: 13, fontFamily: 'FjallaOne_400Regular' }}>What was it for?</Text>
                <TextInput style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 16, fontFamily: 'FjallaOne_400Regular' }}
                  placeholder="e.g. Dinner, Taxi" placeholderTextColor={theme.muted + '50'} value={expDesc} onChangeText={setExpDesc} />
                  
                <Text style={{ color: theme.muted, fontWeight: '600', marginBottom: 8, fontSize: 13, fontFamily: 'FjallaOne_400Regular' }}>Amount (₹)</Text>
                <TextInput style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 14, color: theme.ink, fontSize: 16, marginBottom: 16, fontFamily: 'FjallaOne_400Regular' }}
                  placeholder="0" placeholderTextColor={theme.muted + '50'} keyboardType="numeric" value={expAmount} onChangeText={setExpAmount} />

                <Text style={{ color: theme.muted, fontWeight: '600', marginBottom: 8, fontSize: 13, fontFamily: 'FjallaOne_400Regular' }}>Who paid?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} keyboardShouldPersistTaps="handled">
                  {participants.map(p => {
                    const sel = expPayerId === p.id;
                    return (
                      <TouchableOpacity key={p.id} onPress={() => setExpPayerId(p.id)} activeOpacity={0.8}
                        style={{ backgroundColor: sel ? accentColor : theme.card, borderWidth: 1, borderColor: sel ? accentColor : theme.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {sel && <Check size={14} color="#fff" />}
                        <Text style={{ color: sel ? '#fff' : theme.ink, fontWeight: '600', fontFamily: 'FjallaOne_400Regular' }}>{p.name === localInfo.myName ? 'You' : p.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={{ color: theme.muted, fontWeight: '600', marginBottom: 8, fontSize: 13, fontFamily: 'FjallaOne_400Regular' }}>Split between (tap to exempt)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {participants.map(p => {
                    const included = includedMembers.includes(p.id);
                    return (
                      <TouchableOpacity key={p.id} onPress={() => {
                          if (included) setIncludedMembers(prev => prev.filter(id => id !== p.id));
                          else setIncludedMembers(prev => [...prev, p.id]);
                        }} activeOpacity={0.8}
                        style={{ backgroundColor: included ? accentColor + '15' : theme.card, borderWidth: 1, borderColor: included ? accentColor : theme.border, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: included ? accentColor : theme.muted, fontWeight: '700', fontSize: 13, textDecorationLine: included ? 'none' : 'line-through', fontFamily: 'FjallaOne_400Regular' }}>{p.name === localInfo.myName ? 'You' : p.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity onPress={addExpense} disabled={savingExpense} activeOpacity={0.8}
                  style={{ backgroundColor: accentColor, padding: 18, borderRadius: 24, alignItems: 'center', marginBottom: 20 }}>
                  {savingExpense ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'FjallaOne_400Regular' }}>{editingExpenseId ? 'Save Changes' : 'Split Equally'}</Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: Platform.OS === 'ios' ? 40 : 0 }} />
              </ScrollView>

            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
