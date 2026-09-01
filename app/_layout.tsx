import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../database/schema';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore } from '../store/useThemeStore';
import CustomAlert from '../components/CustomAlert';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';

export default function RootLayout() {
  const isDark = useThemeStore((state) => state.isDark);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    SpaceGrotesk_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="paisapilot.db" onInit={initializeDatabase}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <CustomAlert />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
