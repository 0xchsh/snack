import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="list/[id]"
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerTransparent: true,
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="user/[username]"
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerTransparent: true,
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="purchase/checkout"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  headerTitle: 'Purchase',
                }}
              />
              <Stack.Screen
                name="purchase/success"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
