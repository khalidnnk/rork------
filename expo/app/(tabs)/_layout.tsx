import { Tabs } from 'expo-router';
import { Home, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';

function SingleDestinationTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const isSettings = state.routes[state.index]?.name === 'settings';
  const targetName = isSettings ? '(home)' : 'settings';
  const targetRoute = state.routes.find((route) => route.name === targetName);
  const label = isSettings ? t('prayerTimes') : t('settings');
  const Icon = isSettings ? Home : Settings;

  const handlePress = () => {
    if (!targetRoute) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const event = navigation.emit({
      type: 'tabPress',
      target: targetRoute.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(targetRoute.name, targetRoute.params);
    }
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={isSettings ? t('backPrayerTimes') : t('openSettings')}
        testID={isSettings ? 'go-to-prayer-times' : 'go-to-settings'}
        style={({ pressed }) => [styles.destinationButton, pressed && styles.destinationButtonPressed]}
      >
        <Icon size={22} color={Colors.accentLight} strokeWidth={2} />
        <Text style={styles.destinationLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <SingleDestinationTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('prayerTimes'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.cardBorder,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  destinationButton: {
    minWidth: 148,
    minHeight: 50,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: Colors.accentDim,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  destinationButtonPressed: {
    opacity: 0.72,
  },
  destinationLabel: {
    color: Colors.accentLight,
    fontSize: 15,
    fontFamily: 'Dubai-Bold',
  },
});
