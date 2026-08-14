import '@/amplify-config';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PaperDarkTheme, PaperLightTheme } from '@/constants/paper-theme';
import { AuthProvider, useAuthUser } from '@/providers/auth-provider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuthUser();

  if (status === 'loading') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="confirm-sign-up" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'needsProfile'}>
        <Stack.Screen name="create-profile" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="user/[userId]" />
        <Stack.Screen name="search" />
        <Stack.Screen name="movie/[movieId]" />
        <Stack.Screen name="create-post/[movieId]" />
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={isDark ? PaperDarkTheme : PaperLightTheme}>
        <AuthProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
