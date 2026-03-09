import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import React, { useEffect, useState, useCallback } from 'react';
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AthanProvider, useAthan } from '@/contexts/AthanContext';
import LocationOnboarding from '@/components/LocationOnboarding';

void SplashScreen.preventAutoHideAsync();
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

const ONBOARDING_KEY = 'location_onboarding_seen';

function AppContent() {
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const { detectAutoLocation } = useAthan();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      console.log('[Layout] Onboarding seen:', val);
      setOnboardingSeen(val === 'true');
    }).catch(() => setOnboardingSeen(false));
  }, []);

  const handleOnboardingComplete = useCallback(async (granted: boolean) => {
    console.log('[Layout] Onboarding complete, granted:', granted);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingSeen(true);
    if (granted) {
      void detectAutoLocation();
    }
  }, [detectAutoLocation]);

  if (onboardingSeen === null) return null;

  if (!onboardingSeen) {
    return <LocationOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootLayoutNav() {
  return (
    <AthanProvider>
      <AppContent />
    </AthanProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Dubai-Light': require('../assets/fonts/Dubai-Light.ttf'),
    'Dubai-Regular': require('../assets/fonts/Dubai-Regular.ttf'),
    'Dubai-Medium': require('../assets/fonts/Dubai-Medium.ttf'),
    'Dubai-Bold': require('../assets/fonts/Dubai-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
