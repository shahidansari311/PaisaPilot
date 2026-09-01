import { View, Text, TouchableOpacity, Image } from 'react-native';
import { CustomAlert as Alert } from '../utils/alert';
import { useThemeStore } from '../store/useThemeStore';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Camera, ScanText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Gradients } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReceiptOcr() {
  const isDark = useThemeStore((state) => state.isDark);
  const theme = isDark ? Colors.dark : Colors.light;
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
          <ArrowLeft size={22} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.ink , fontFamily: 'Outfit_700Bold'}}>Scan Receipt</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {!image ? (
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={{ flex: 1, backgroundColor: theme.card, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border, marginBottom: 16 }}
          >
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Camera size={32} color={theme.muted} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.ink , fontFamily: 'Inter_700Bold'}}>Tap to Select Receipt</Text>
            <Text style={{ color: theme.muted, marginTop: 8, textAlign: 'center', paddingHorizontal: 32, fontSize: 13, lineHeight: 20 , fontFamily: 'Inter_500Medium'}}>
              Take a photo or select an image of your receipt to extract the total.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, marginBottom: 16 }}>
            <Image source={{ uri: image }} style={{ flex: 1, borderRadius: 24 }} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => setImage(null)}
              activeOpacity={0.7}
              style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' , fontFamily: 'Inter_700Bold'}}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={processOCR}
          disabled={!image || isProcessing}
          activeOpacity={0.85}
          style={{ borderRadius: 14, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={image ? theme.primaryGradient : [theme.surface, theme.surface]}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16 }}
          >
            <ScanText size={20} color={image ? '#fff' : theme.muted} />
            <Text style={{ fontWeight: '800', fontSize: 16, color: image ? '#fff' : theme.muted , fontFamily: 'Outfit_700Bold'}}>
              {isProcessing ? 'Processing...' : 'Extract Data'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
