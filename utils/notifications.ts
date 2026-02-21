import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTime, PrayerName } from './prayerTimes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

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
  enabled: boolean
): Promise<string | null> {
  if (Platform.OS === 'web' || !enabled) return null;

  const now = new Date();
  if (prayer.time <= now) {
    console.log(`[Notifications] Skipping ${prayer.name} - time already passed`);
    return null;
  }

  const secondsUntil = Math.floor((prayer.time.getTime() - now.getTime()) / 1000);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `حان وقت صلاة ${prayer.labelAr}`,
        body: `${prayer.label} - ${prayer.timeStr}`,
        sound: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: 'athan' } : {}),
        data: { prayerName: prayer.name, time: prayer.timeStr },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsUntil),
      },
    });

    console.log(`[Notifications] Scheduled ${prayer.name} in ${secondsUntil}s, id: ${id}`);
    return id;
  } catch (error) {
    console.error(`[Notifications] Error scheduling ${prayer.name}:`, error);
    return null;
  }
}

export async function scheduleAllNotifications(
  prayers: PrayerTime[],
  enabledPrayers: Record<PrayerName, boolean>
): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Cleared all existing notifications');

  for (const prayer of prayers) {
    if (enabledPrayers[prayer.name]) {
      await scheduleAthanNotification(prayer, true);
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] All notifications cancelled');
}
