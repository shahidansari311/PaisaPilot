import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { CustomAlert as Alert } from '../../utils/alert';
import { useThemeStore } from '../../store/useThemeStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { BorrowRecord, LendRecord } from '../../types/database';
import { Plus, HandCoins, Handshake, Clock, AlertTriangle, MessageCircle, Bell, BellOff } from 'lucide-react-native';
import { Link, useFocusEffect } from 'expo-router';

const WA_GREEN = '#25D366';

export default function BorrowLend() {
  const isDark = useThemeStore((state) => state.isDark);
  const db = useSQLiteContext();
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [lendRecords, setLendRecords] = useState<LendRecord[]>([]);

  useFocusEffect(useCallback(() => { loadRecords(); }, []));

  const loadRecords = async () => {
    try {
      setBorrowRecords(await db.getAllAsync<BorrowRecord>('SELECT * FROM borrow_records ORDER BY createdAt DESC'));
      setLendRecords(await db.getAllAsync<LendRecord>('SELECT * FROM lend_records ORDER BY createdAt DESC'));
    } catch (e) { console.error(e); }
  };

  const deleteRecord = async (id: string, table: string) => {
    try {
      await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
      loadRecords();
    } catch (e) {
      Alert.alert('Oops!', 'We could not delete the record. Please try again.');
    }
  };

  const confirmDelete = (id: string, person: string) => {
    const table = activeTab === 'borrowed' ? 'borrow_records' : 'lend_records';
    Alert.alert('Delete Record? 🗑️', `Remove the record for ${person}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(id, table) },
    ]);
  };

  const sendWhatsApp = (record: BorrowRecord | LendRecord, type: 'borrowed' | 'lent') => {
    const amount = record.amount;
    const person = record.person;
    const formattedDate = new Date(record.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    let message = '';
    if (type === 'lent') {
      message = `Bhai paise wapas kar de 🙏\n₹${amount} baaki hai. Jarurat hai `;
    } else {
      message = `Hey ${person}! Mai tere ₹${amount} rupey nahi bhula hoon. ${formattedDate} tak clear kar dunga! 🙏`;
    }

    // If phone is saved, open directly to their chat
    const phone = (record as any).phone;
    let url: string;
    if (phone && phone.length >= 10) {
      const fullPhone = '91' + phone.replace(/\D/g, '');
      url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
    } else {
      url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    }

    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Alert.alert('WhatsApp Missing', 'We could not find WhatsApp on your phone.');
    }).catch(console.error);
  };

  const totalBorrowed = borrowRecords.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const totalLent = lendRecords.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const activeRecords = activeTab === 'borrowed' ? borrowRecords : lendRecords;
  const getDaysLeft = (dueDate: string) => Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
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
  const activeAccent = activeTab === 'borrowed' ? danger : success;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: border, backgroundColor: bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '900', color: ink, letterSpacing: -0.5 , fontFamily: 'CormorantGaramond_700Bold'}}>Debt Tracker 🤝</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: muted, marginTop: 3 , fontFamily: 'DMSans_500Medium'}}>Long press to delete</Text>
          </View>
        </View>
      </View>

      {/* SUMMARY */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Homies Owe Me', value: totalLent, color: success },
          { label: 'I Owe Homies', value: totalBorrowed, color: danger },
        ].map(({ label, value, color }) => (
          <View key={label} style={{ flex: 1, backgroundColor: card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: border }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: muted, textTransform: 'uppercase', marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>{label}</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}} adjustsFontSizeToFit numberOfLines={1}>
              ₹{value.toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>

      {/* TAB TOGGLE */}
      <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: raised, borderRadius: 18, padding: 5, flexDirection: 'row', borderWidth: 1, borderColor: border }}>
        {(['borrowed', 'lent'] as const).map(tab => {
          const tabColor = tab === 'borrowed' ? danger : success;
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: isActive ? card : 'transparent', elevation: isActive ? 2 : 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: isActive ? tabColor : muted, textTransform: 'uppercase' , fontFamily: 'CormorantGaramond_700Bold'}}>
                {tab === 'borrowed' ? 'I Borrowed' : 'I Lent'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}>

        {activeRecords.length === 0 ? (
          <View style={{ backgroundColor: card, borderRadius: 22, padding: 36, alignItems: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed', marginTop: 8 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: activeAccent + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              {activeTab === 'borrowed' ? <HandCoins size={32} color={activeAccent} /> : <Handshake size={32} color={activeAccent} />}
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: ink, marginBottom: 6 , fontFamily: 'CormorantGaramond_700Bold'}}>No debts here! 🎉</Text>
            <Text style={{ fontSize: 13, color: muted, textAlign: 'center', lineHeight: 20 , fontFamily: 'DMSans_500Medium'}}>
              Tap the + button to add a record.
            </Text>
          </View>
        ) : (
          activeRecords.map(record => {
            const daysLeft = getDaysLeft(record.dueDate);
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft >= 0 && daysLeft <= 3;
            const urgColor = isOverdue ? danger : isUrgent ? warning : activeAccent;
            const isPending = record.status === 'pending';
            const hasPhone = !!(record as any).phone;

            return (
              <TouchableOpacity key={record.id}
                onLongPress={() => confirmDelete(record.id, record.person)}
                delayLongPress={350}
                activeOpacity={0.85}
                style={{ backgroundColor: card, borderRadius: 22, marginBottom: 14, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
                {/* Urgency bar */}
                <View style={{ height: 4, backgroundColor: urgColor }} />
                <View style={{ padding: 16 }}>
                  {/* Top row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: urgColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: urgColor , fontFamily: 'CormorantGaramond_700Bold'}}>{record.person.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: ink , fontFamily: 'CormorantGaramond_700Bold'}}>{record.person}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          {isOverdue ? <AlertTriangle size={13} color={urgColor} /> : <Clock size={13} color={muted} />}
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isOverdue ? urgColor : muted , fontFamily: 'DMSans_700Bold'}}>
                            {isOverdue ? `${Math.abs(daysLeft)}d late 💀` : daysLeft === 0 ? 'Due today 🚨' : `${daysLeft}d left ⏳`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: activeAccent, fontVariant: ['tabular-nums'] , fontFamily: 'CormorantGaramond_700Bold'}}>
                        ₹{record.amount.toLocaleString('en-IN')}
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: isPending ? warning + '20' : success + '20', marginTop: 5 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: isPending ? warning : success , fontFamily: 'CormorantGaramond_700Bold'}}>
                          {record.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Notes */}
                  {(record as any).notes ? (
                    <Text style={{ fontSize: 13, color: muted, marginBottom: 12, backgroundColor: raised, padding: 10, borderRadius: 10, fontWeight: '500' , fontFamily: 'DMSans_500Medium'}}>
                      "{(record as any).notes}"
                    </Text>
                  ) : null}

                  {/* Phone badge */}
                  {hasPhone && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <View style={{ backgroundColor: WA_GREEN + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: WA_GREEN , fontFamily: 'DMSans_700Bold'}}>
                          📱 +91 {(record as any).phone}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* WhatsApp button */}
                  <TouchableOpacity onPress={() => sendWhatsApp(record, activeTab)} activeOpacity={0.75}
                    style={{ backgroundColor: WA_GREEN + '15', paddingVertical: 11, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: WA_GREEN + '30' }}>
                    <MessageCircle size={17} color={WA_GREEN} />
                    <Text style={{ color: WA_GREEN, fontWeight: '800', fontSize: 14 , fontFamily: 'CormorantGaramond_700Bold'}}>
                      {hasPhone ? 'Open Chat Directly' : 'Send via WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB — positioned above tab bar */}
      <Link href="/add-borrow-lend" asChild>
        <TouchableOpacity activeOpacity={0.85} style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 58, height: 58, borderRadius: 29,
          backgroundColor: primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12
        }}>
          <Plus size={28} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      </Link>
    </View>
  );
}
