import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, FlatList } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ArrowLeft, UserPlus, Receipt, Trash2, Edit2, Check, X, Users, ChevronDown, Share } from 'lucide-react-native';
import { SplitGroup, SplitParticipant } from '../../types/database';
import { exportSplitGroupPDF } from '../../utils/export';

type Expense = { id: string; paidBy: string; totalAmount: number; description: string; createdAt: string; };

export default function GroupDetails() {
  const { id } = useLocalSearchParams();
  const { isDark, accentColor } = useThemeStore();
  const db = useSQLiteContext();
  const [group, setGroup] = useState<SplitGroup | null>(null);
  const [participants, setParticipants] = useState<SplitParticipant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shares, setShares] = useState<Record<string, {participantId: string, owedAmount: number}[]>>({});
  const [settlements, setSettlements] = useState<{from: string; to: string; amount: number}[]>([]);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Modals & Forms
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expPayerId, setExpPayerId] = useState('');
  const [includedMembers, setIncludedMembers] = useState<string[]>([]);

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      const g = await db.getFirstAsync<SplitGroup>(`SELECT * FROM split_groups WHERE id = ?`, [id as string]);
      if (g) setGroup(g);
      
      const parts = await db.getAllAsync<SplitParticipant>(`SELECT * FROM split_participants WHERE groupId = ?`, [id as string]);
      setParticipants(parts);
      
      const exps = await db.getAllAsync<Expense>(`SELECT * FROM split_expenses WHERE groupId = ? ORDER BY createdAt DESC`, [id as string]);
      setExpenses(exps);

      const allShares = await db.getAllAsync<{expenseId: string, participantId: string, owedAmount: number}>('SELECT * FROM split_shares');
      const shareMap: Record<string, {participantId: string, owedAmount: number}[]> = {};
      allShares.forEach(s => {
        if (!shareMap[s.expenseId]) shareMap[s.expenseId] = [];
        shareMap[s.expenseId].push(s);
      });
      setShares(shareMap);

      calculateSettlements(parts, exps);
    } catch (e) { console.error(e); }
  };

  const calculateSettlements = async (parts: SplitParticipant[], exps: Expense[]) => {
    if (parts.length === 0 || exps.length === 0) { setSettlements([]); return; }
    const balances: Record<string, number> = {};
    parts.forEach(p => balances[p.id] = 0);

    for (const exp of exps) {
      if (balances[exp.paidBy] !== undefined) {
        balances[exp.paidBy] += exp.totalAmount;
      }
      const shares = await db.getAllAsync<{participantId: string; owedAmount: number}>('SELECT * FROM split_shares WHERE expenseId = ?', [exp.id]);
      for (const share of shares) {
        if (balances[share.participantId] !== undefined) {
          balances[share.participantId] -= share.owedAmount;
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

  const handleExportPDF = async () => {
    try {
      await exportSplitGroupPDF(db, id as string);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  // Participant Actions
  const addParticipant = async () => {
    if (!newUserName.trim()) return;
    try {
      if (editingUserId) {
        await db.runAsync('UPDATE split_participants SET name = ? WHERE id = ?', [newUserName.trim(), editingUserId]);
      } else {
        await db.runAsync(`INSERT INTO split_participants (id, groupId, name) VALUES (?, ?, ?)`, [`p-${Date.now()}`, id as string, newUserName.trim()]);
      }
      setNewUserName(''); setIsAddingUser(false); setEditingUserId(null); loadData();
    } catch (e) { Alert.alert('Error', 'Failed to save participant'); }
  };

  const deleteParticipant = async (pId: string) => {
    try {
      await db.runAsync('DELETE FROM split_participants WHERE id = ?', [pId]);
      loadData();
    } catch (e) { Alert.alert('Error', 'Failed to delete'); }
  };

  const handleParticipantAction = (p: SplitParticipant) => {
    Alert.alert('Manage Participant ⚙️', p.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => { setEditingUserId(p.id); setNewUserName(p.name); setIsAddingUser(true); } },
      { text: 'Delete', style: 'destructive', onPress: () => {
        Alert.alert('Delete?', 'This person will be removed from future calculations.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteParticipant(p.id) }
        ])
      }}
    ]);
  };

  // Expense Actions
  const addExpense = async () => {
    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0 || !expDesc.trim() || !expPayerId) { Alert.alert('Error', 'Please fill all fields'); return; }
    if (includedMembers.length === 0) { Alert.alert('Wait!', 'At least one member must be included in the split.'); return; }
    try {
      let expId = editingExpenseId;
      
      if (expId) {
        // Update existing expense
        await db.runAsync('UPDATE split_expenses SET paidBy = ?, totalAmount = ?, description = ? WHERE id = ?', [expPayerId, amt, expDesc.trim(), expId]);
        // Delete old shares
        await db.runAsync('DELETE FROM split_shares WHERE expenseId = ?', [expId]);
      } else {
        // Create new expense
        expId = `se-${Date.now()}`;
        await db.runAsync(
          'INSERT INTO split_expenses (id, groupId, paidBy, totalAmount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [expId, id as string, expPayerId, amt, expDesc.trim(), new Date().toISOString()]
        );
      }
      
      // Add shares (Equal split among included members)
      const splitAmount = amt / includedMembers.length;
      for (const pId of includedMembers) {
        await db.runAsync(
          'INSERT INTO split_shares (expenseId, participantId, owedAmount) VALUES (?, ?, ?)',
          [expId as string, pId, splitAmount]
        );
      }
      
      setShowExpenseModal(false); setExpAmount(''); setExpDesc(''); setExpPayerId(''); setEditingExpenseId(null); setIncludedMembers([]);
      loadData();
    } catch (e) { Alert.alert('Error', 'Failed to save expense'); }
  };

  const handleExpenseAction = (exp: Expense) => {
    Alert.alert('Expense Actions ⚙️', exp.description, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: async () => {
          setEditingExpenseId(exp.id);
          setExpAmount(exp.totalAmount.toString());
          setExpDesc(exp.description);
          setExpPayerId(exp.paidBy);
          const existingShares = await db.getAllAsync<{participantId: string}>('SELECT participantId FROM split_shares WHERE expenseId = ?', [exp.id]);
          setIncludedMembers(existingShares.map(s => s.participantId));
          setShowExpenseModal(true);
      }},
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(exp.id) }
    ]);
  };

  const deleteExpense = async (expId: string) => {
    Alert.alert('Delete Expense? 🗑️', 'This will remove the expense and recalculate settlements.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await db.runAsync('DELETE FROM split_expenses WHERE id = ?', [expId]);
          loadData();
      }}
    ]);
  };

  const bg    = isDark ? '#0D1117' : '#F4F3F0';
  const card  = isDark ? '#161B22' : '#FFFFFF';
  const raised = isDark ? '#1C2333' : '#F0EFEB';
  const border = isDark ? '#21262D' : '#E2E0DA';
  const ink   = isDark ? '#E6EDF3' : '#1A1A2E';
  const muted = '#6E7681';

  if (!group) return <View style={{ flex: 1, backgroundColor: bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={22} color={ink} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>{group.name}</Text>
        </View>
        <TouchableOpacity onPress={handleExportPDF} activeOpacity={0.7} style={{ padding: 8, backgroundColor: accentColor + '15', borderRadius: 20 }}>
          <Share size={18} color={accentColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* Settlements Summary */}
        {settlements.length > 0 && (
          <View style={{ backgroundColor: accentColor + '10', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: accentColor + '40', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={18} color={accentColor} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: accentColor, textTransform: 'uppercase', letterSpacing: 1 , fontFamily: 'CormorantGaramond_700Bold'}}>Who owes who?</Text>
            </View>
            {settlements.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < settlements.length -1 ? 1 : 0, borderBottomColor: accentColor + '20' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: ink , fontFamily: 'DMSans_500Medium'}}>{s.from} <Text style={{ color: muted, fontWeight: '400' , fontFamily: 'DMSans_400Regular'}}>owes</Text> {s.to}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#F43F5E' , fontFamily: 'CormorantGaramond_700Bold'}}>₹{s.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Participants */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: muted, letterSpacing: 1.5, textTransform: 'uppercase' , fontFamily: 'DMSans_500Medium'}}>Participants</Text>
          <TouchableOpacity onPress={() => setIsAddingUser(!isAddingUser)} activeOpacity={0.7}>
            <UserPlus size={20} color={accentColor} />
          </TouchableOpacity>
        </View>

        {isAddingUser && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: card, borderRadius: 18, padding: 12, color: ink, fontSize: 14, borderWidth: 1, borderColor: border }}
              placeholder="Name (e.g. Rahul)"
              placeholderTextColor={muted}
              value={newUserName}
              onChangeText={setNewUserName}
            />
            <TouchableOpacity onPress={addParticipant} activeOpacity={0.8}
              style={{ paddingHorizontal: 16, justifyContent: 'center', borderRadius: 18, backgroundColor: accentColor }}>
              <Text style={{ color: '#fff', fontWeight: '700' , fontFamily: 'DMSans_700Bold'}}>{editingUserId ? 'Save' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {participants.length === 0 ? (
            <Text style={{ color: muted, fontStyle: 'italic', fontSize: 13 , fontFamily: 'DMSans_500Medium'}}>No participants added yet.</Text>
          ) : (
            participants.map(p => (
              <TouchableOpacity key={p.id} onLongPress={() => handleParticipantAction(p)} delayLongPress={300} activeOpacity={0.7}
                style={{ backgroundColor: accentColor + '18', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: accentColor + '40' }}>
                <Text style={{ fontWeight: '600', color: ink, fontSize: 13 , fontFamily: 'DMSans_500Medium'}}>{p.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Expenses */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: muted, letterSpacing: 1.5, textTransform: 'uppercase' , fontFamily: 'DMSans_500Medium'}}>Expenses</Text>
          <TouchableOpacity onPress={() => { setEditingExpenseId(null); setExpAmount(''); setExpDesc(''); setExpPayerId(''); setIncludedMembers(participants.map(p => p.id)); setShowExpenseModal(true); }} activeOpacity={0.7}>
            <Receipt size={20} color={accentColor} />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: card, borderRadius: 24, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
          {expenses.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: raised, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Receipt size={26} color={muted} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 6 , fontFamily: 'DMSans_700Bold'}}>No expenses yet</Text>
              <Text style={{ color: muted, textAlign: 'center', fontSize: 13, lineHeight: 20 , fontFamily: 'DMSans_500Medium'}}>
                Tap the receipt icon to add an expense.
              </Text>
            </View>
          ) : (
            expenses.map((exp, i) => {
              const payer = participants.find(p => p.id === exp.paidBy)?.name || 'Unknown';
              return (
                <TouchableOpacity key={exp.id} onPress={() => setExpandedExpenseId(expandedExpenseId === exp.id ? null : exp.id)} onLongPress={() => handleExpenseAction(exp)} delayLongPress={300} activeOpacity={0.7}
                  style={{ padding: 16, borderBottomWidth: i < expenses.length -1 ? 1 : 0, borderBottomColor: border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: ink, marginBottom: 2 , fontFamily: 'DMSans_700Bold'}}>{exp.description}</Text>
                      <Text style={{ fontSize: 12, color: muted , fontFamily: 'DMSans_500Medium'}}>Paid by {payer}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>₹{exp.totalAmount}</Text>
                  </View>
                  
                  {expandedExpenseId === exp.id && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: border + '50' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 , fontFamily: 'CormorantGaramond_700Bold'}}>Split between</Text>
                      {shares[exp.id]?.map(share => {
                        const pName = participants.find(p => p.id === share.participantId)?.name || 'Unknown';
                        return (
                          <View key={share.participantId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, color: ink, fontWeight: '500' , fontFamily: 'DMSans_500Medium'}}>{pName}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: muted , fontFamily: 'DMSans_700Bold'}}>₹{share.owedAmount.toFixed(2)}</Text>
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

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showExpenseModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <X size={24} color={muted} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ color: muted, fontWeight: '600', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_500Medium'}}>What was it for?</Text>
            <TextInput style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 18, padding: 14, color: ink, fontSize: 16, marginBottom: 16 , fontFamily: 'DMSans_500Medium'}}
              placeholder="e.g. Dinner, Taxi" placeholderTextColor={muted} value={expDesc} onChangeText={setExpDesc} />
              
            <Text style={{ color: muted, fontWeight: '600', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_500Medium'}}>Amount (₹)</Text>
            <TextInput style={{ backgroundColor: card, borderWidth: 1, borderColor: border, borderRadius: 18, padding: 14, color: ink, fontSize: 16, marginBottom: 16 , fontFamily: 'DMSans_500Medium'}}
              placeholder="0" placeholderTextColor={muted} keyboardType="numeric" value={expAmount} onChangeText={setExpAmount} />

            <Text style={{ color: muted, fontWeight: '600', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_500Medium'}}>Who paid?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {participants.map(p => {
                const sel = expPayerId === p.id;
                return (
                  <TouchableOpacity key={p.id} onPress={() => setExpPayerId(p.id)} activeOpacity={0.8}
                    style={{ backgroundColor: sel ? accentColor : card, borderWidth: 1, borderColor: sel ? accentColor : border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {sel && <Check size={14} color="#fff" />}
                    <Text style={{ color: sel ? '#fff' : ink, fontWeight: '600' , fontFamily: 'DMSans_500Medium'}}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={{ color: muted, fontWeight: '600', marginBottom: 8, fontSize: 13 , fontFamily: 'DMSans_500Medium'}}>Split between (tap to exempt)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {participants.map(p => {
                const included = includedMembers.includes(p.id);
                return (
                  <TouchableOpacity key={p.id} onPress={() => {
                      if (included) setIncludedMembers(prev => prev.filter(id => id !== p.id));
                      else setIncludedMembers(prev => [...prev, p.id]);
                    }} activeOpacity={0.8}
                    style={{ backgroundColor: included ? accentColor + '15' : card, borderWidth: 1, borderColor: included ? accentColor : border, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: included ? accentColor : muted, fontWeight: '700', fontSize: 13, textDecorationLine: included ? 'none' : 'line-through' , fontFamily: 'DMSans_700Bold'}}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={addExpense} activeOpacity={0.8}
              style={{ backgroundColor: accentColor, padding: 18, borderRadius: 24, alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' , fontFamily: 'CormorantGaramond_700Bold'}}>{editingExpenseId ? 'Save Changes 💾' : 'Split Equally 💸'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
