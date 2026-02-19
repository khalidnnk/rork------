import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AthanProvider } from '@/contexts/AthanContext';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync('#0B1A1F').catch(() => {});

const queryClient = new QueryClient();

interface TextWithDefaultProps extends Text {
  defaultProps?: { style?: Record<string, unknown> };
}

if ((Text as unknown as TextWithDefaultProps).defaultProps == null) {
  (Text as unknown as TextWithDefaultProps).defaultProps = {};
}
(Text as unknown as TextWithDefaultProps).defaultProps!.style = {
  ...(Text as unknown as TextWithDefaultProps).defaultProps!.style,
  fontFamily: 'Dubai-Regular',
};

if ((TextInput as unknown as TextWithDefaultProps).defaultProps == null) {
  (TextInput as unknown as TextWithDefaultProps).defaultProps = {};
}
(TextInput as unknown as TextWithDefaultProps).defaultProps!.style = {
  ...(TextInput as unknown as TextWithDefaultProps).defaultProps!.style,
  fontFamily: 'Dubai-Regular',
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Dubai-Light': require('@/assets/fonts/Dubai-Light.ttf'),
    'Dubai-Regular': require('@/assets/fonts/Dubai-Regular.ttf'),
    'Dubai-Medium': require('@/assets/fonts/Dubai-Medium.ttf'),
    'Dubai-Bold': require('@/assets/fonts/Dubai-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AthanProvider>
          <RootLayoutNav />
        </AthanProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
