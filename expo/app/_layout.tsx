import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import React, { useEffect, useState, useCallback } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AthanProvider, useAthan } from '@/contexts/AthanContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import LocationOnboarding from '@/components/LocationOnboarding';
import '@/utils/backgroundLocation';

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
  const { isRTL, isReady, t } = useLanguage();

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (url.startsWith('alsulaimani-athan://refresh-location')) {
        void detectAutoLocation();
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    return () => subscription.remove();
  }, [detectAutoLocation]);

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

  if (onboardingSeen === null || !isReady) return null;

  if (!onboardingSeen) {
    return <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}><LocationOnboarding onComplete={handleOnboardingComplete} /></View>;
  }

  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
    <Stack screenOptions={{ headerBackTitle: t('back') }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <LanguageProvider>
      <AthanProvider>
        <AppContent />
      </AthanProvider>
    </LanguageProvider>
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
