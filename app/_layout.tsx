import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '../src/stores/useUserStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useChatStore } from '../src/stores/useChatStore';
import { socketService } from '../src/services/socketService';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const loadUserInitialState = useUserStore((state) => state.loadInitialState);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const serverUrl = useSettingsStore((state) => state.serverUrl);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Load persisted state, initialize SQLite outbox engine & connect sockets
    Promise.all([
      loadUserInitialState(),
      loadSettings(),
      useChatStore.getState().initStore(),
    ]).then(() => {
      socketService.initialize(serverUrl);
      SplashScreen.hideAsync();
    });
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  const themePreference = useUserStore((state) => state.themePreference);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isHydrated = useUserStore((state) => state.isHydrated);

  const router = useRouter();
  const segments = useSegments();

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemColorScheme === 'dark');

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isHydrated, isAuthenticated, segments]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth/phone" options={{ headerShown: false }} />
        <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
        <Stack.Screen name="auth/profile" options={{ headerShown: false }} />
        <Stack.Screen name="new-chat" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
