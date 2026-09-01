import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../database/schema';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore } from '../store/useThemeStore';
import CustomAlert from '../components/CustomAlert';
import { useFonts as useOutfitFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { useFonts as useInterFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { View } from 'react-native';
import { useState } from 'react';

// Keep native splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

let hasAppLaunched = false;

export default function RootLayout() {
  const isDark = useThemeStore((state) => state.isDark);
  const [showSplash, setShowSplash] = useState(!hasAppLaunched);

  const [outfitLoaded] = useOutfitFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const isReady = outfitLoaded && interLoaded;

  useEffect(() => {
    if (isReady && showSplash) {
      // Hide the native splash screen, revealing our JS AnimatedSplashScreen
      SplashScreen.hideAsync().catch(() => {});
    } else if (isReady && !showSplash) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, showSplash]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="paisapilot.db" onInit={initializeDatabase}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <CustomAlert />
          <StatusBar style={isDark ? 'light' : 'dark'} />
          
          {showSplash && (
            <AnimatedSplashScreen 
              onAnimationFinish={() => {
                hasAppLaunched = true;
                setShowSplash(false);
              }} 
            />
          )}
        </View>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
