import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../database/schema';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore } from '../store/useThemeStore';
import CustomAlert from '../components/CustomAlert';

export default function RootLayout() {
  const isDark = useThemeStore((state) => state.isDark);

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
