import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { useAlertStore } from '../store/useAlertStore';
import { useThemeStore } from '../store/useThemeStore';
import { useEffect, useRef } from 'react';

export default function CustomAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();
  const { isDark, accentColor } = useThemeStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  const bg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const border = isDark ? '#334155' : '#E2E8F0';
  const danger = '#F43F5E';

  const handlePress = (onPress?: () => void) => {
    hideAlert();
    setTimeout(() => { if (onPress) onPress(); }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={hideAlert}>
      <Animated.View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 24, opacity: fadeAnim }}>
        <Animated.View style={{ backgroundColor: card, borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden', transform: [{ scale: scaleAnim }], elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
          
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: ink, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
            {!!message && (
              <Text style={{ fontSize: 15, color: muted, textAlign: 'center', lineHeight: 22 }}>{message}</Text>
            )}
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: border, flexDirection: buttons.length > 2 ? 'column' : 'row' }}>
            {buttons.map((btn, idx) => {
              const isLast = idx === buttons.length - 1;
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const textColor = isDestructive ? danger : isCancel ? muted : accentColor;
              const fontWeight = isCancel ? '600' : '800';

              return (
                <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => handlePress(btn.onPress)}
                  style={{ flex: buttons.length > 2 ? 0 : 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRightWidth: (buttons.length <= 2 && !isLast) ? 1 : 0, borderRightColor: border, borderBottomWidth: (buttons.length > 2 && !isLast) ? 1 : 0, borderBottomColor: border }}>
                  <Text style={{ fontSize: 16, fontWeight: fontWeight, color: textColor }}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
