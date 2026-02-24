import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTime, PrayerName } from './prayerTimes';
import { NotificationSoundType } from '@/contexts/AthanContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

function getNotificationSound(soundType: NotificationSoundType): boolean | string {
  switch (soundType) {
    case 'athan':
      return 'haya-ala-salah.m4a';
    case 'full_athan':
      return 'athan.mp3';
    case 'default':
      return true;
    case 'silent':
      return false;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping permission request');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: false,
        allowCriticalAlerts: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('athan', {
      name: 'Athan Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  console.log('[Notifications] Permission granted');
  return true;
}

export async function scheduleAthanNotification(
  prayer: PrayerTime,
  enabled: boolean,
  soundType: NotificationSoundType = 'athan'
): Promise<string | null> {
  if (Platform.OS === 'web' || !enabled) return null;

  const now = new Date();
  if (prayer.time <= now) {
    console.log(`[Notifications] Skipping ${prayer.name} - time already passed`);
    return null;
  }

  const secondsUntil = Math.floor((prayer.time.getTime() - now.getTime()) / 1000);
  const sound = getNotificationSound(soundType);
  console.log(`[Notifications] Sound for ${prayer.name}: ${sound} (type: ${soundType})`);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `حان وقت صلاة ${prayer.labelAr}`,
        body: `${prayer.label} - ${prayer.timeStr}`,
        sound: sound,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: 'athan' } : {}),
        data: { prayerName: prayer.name, time: prayer.timeStr },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsUntil),
      },
    });

    console.log(`[Notifications] Scheduled ${prayer.name} in ${secondsUntil}s, id: ${id}, sound: ${sound}`);
    return id;
  } catch (error) {
    console.error(`[Notifications] Error scheduling ${prayer.name}:`, error);
    return null;
  }
}

export async function scheduleAllNotifications(
  prayers: PrayerTime[],
  enabledPrayers: Record<PrayerName, boolean>,
  soundType: NotificationSoundType = 'athan'
): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Cleared all existing notifications, soundType:', soundType);

  for (const prayer of prayers) {
    if (enabledPrayers[prayer.name]) {
      await scheduleAthanNotification(prayer, true, soundType);
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] All notifications cancelled');
}
