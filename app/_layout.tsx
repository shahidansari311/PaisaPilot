import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../database/schema';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore } from '../store/useThemeStore';
import CustomAlert from '../components/CustomAlert';
import { useFonts as useFjallaFonts, FjallaOne_400Regular } from '@expo-google-fonts/fjalla-one';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';

// Apply global font to all Text and TextInput components
interface TextWithDefaultProps extends Text {
    defaultProps?: { style?: any };
}
interface TextInputWithDefaultProps extends TextInput {
    defaultProps?: { style?: any };
}

((Text as unknown) as TextWithDefaultProps).defaultProps = ((Text as unknown) as TextWithDefaultProps).defaultProps || {};
((Text as unknown) as TextWithDefaultProps).defaultProps!.style = { fontFamily: 'FjallaOne_400Regular' };

((TextInput as unknown) as TextInputWithDefaultProps).defaultProps = ((TextInput as unknown) as TextInputWithDefaultProps).defaultProps || {};
((TextInput as unknown) as TextInputWithDefaultProps).defaultProps!.style = { fontFamily: 'FjallaOne_400Regular' };

// Keep native splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

let hasAppLaunched = false;

export default function RootLayout() {
  const isDark = useThemeStore((state) => state.isDark);
  const [showSplash, setShowSplash] = useState(!hasAppLaunched);

  const [fjallaLoaded] = useFjallaFonts({
    FjallaOne_400Regular,
  });

  const isReady = fjallaLoaded;

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
          <Stack screenOptions={{ headerShown: false, animation: 'default' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
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
