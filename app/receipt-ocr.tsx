import { View, Text, TouchableOpacity, Image } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Camera, ScanText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ReceiptOcr() {
  const isDark = useThemeStore((state) => state.isDark);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const processOCR = () => {
    if (!image) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert('Simulated OCR Result', 'Extracted Amount: ₹1,250\nMerchant: Reliance Smart\nDate: 15/07/2026\n\n(Native on-device OCR requires a custom dev client. This is a mockup for Expo Go).');
    }, 1500);
  };

  const bg = isDark ? '#0D1117' : '#F4F3F0';
  const card = isDark ? '#161B22' : '#FFFFFF';
  const border = isDark ? '#21262D' : '#E2E0DA';
  const ink = isDark ? '#E6EDF3' : '#1A1A2E';
  const muted = '#6E7681';
  const jade = '#10B981';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
          <ArrowLeft size={22} color={ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: ink }}>Scan Receipt</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {!image ? (
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={{ flex: 1, backgroundColor: card, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: border, marginBottom: 16 }}
          >
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#1C2333' : '#F0EFEB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Camera size={32} color={muted} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: ink }}>Tap to Select Receipt</Text>
            <Text style={{ color: muted, marginTop: 8, textAlign: 'center', paddingHorizontal: 32, fontSize: 13, lineHeight: 20 }}>
              Take a photo or select an image of your receipt to extract the total.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, marginBottom: 16 }}>
            <Image source={{ uri: image }} style={{ flex: 1, borderRadius: 16 }} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => setImage(null)}
              activeOpacity={0.7}
              style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={processOCR}
          disabled={!image || isProcessing}
          activeOpacity={0.85}
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: image ? jade : (isDark ? '#1C2333' : '#E2E0DA') }}
        >
          <ScanText size={20} color={image ? '#fff' : muted} />
          <Text style={{ fontWeight: '800', fontSize: 16, color: image ? '#fff' : muted }}>
            {isProcessing ? 'Processing...' : 'Extract Data'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
