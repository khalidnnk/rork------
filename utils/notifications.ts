import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTime, PrayerName, calculatePrayerTimes, getTimezoneOffset } from './prayerTimes';
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

function getIOSNotificationCategory(soundType: NotificationSoundType): string {
  switch (soundType) {
    case 'athan':
      return 'athan_haya';
    case 'full_athan':
      return 'athan_full';
    default:
      return 'athan_default';
  }
}

async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await Notifications.setNotificationCategoryAsync('athan_full', [
      {
        identifier: 'OPEN_ATHAN',
        buttonTitle: 'استمع للأذان كاملاً',
        options: {
          opensAppToForeground: true,
        },
      },
    ], {
      allowInCarPlay: true,
    });
    await Notifications.setNotificationCategoryAsync('athan_haya', [
      {
        identifier: 'OPEN_ATHAN',
        buttonTitle: 'فتح التطبيق',
        options: {
          opensAppToForeground: true,
        },
      },
    ], {
      allowInCarPlay: true,
    });
    await Notifications.setNotificationCategoryAsync('athan_default', [], {
      allowInCarPlay: true,
    });
    console.log('[Notifications] iOS notification categories with actions set');
  } catch (e) {
    console.log('[Notifications] Error setting iOS categories:', e);
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
        allowProvisional: false,
      },
    });
    finalStatus = status;
    console.log('[Notifications] iOS permission result:', status);
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
      sound: 'default',
      enableVibrate: true,
      showBadge: false,
    });
  }

  await setupNotificationCategories();

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
    const notificationContent: Notifications.NotificationContentInput = {
      title: `حان وقت صلاة ${prayer.labelAr}`,
      body: soundType === 'full_athan'
        ? `${prayer.label} - ${prayer.timeStr} | اسحب للاستماع للأذان كاملاً`
        : `${prayer.label} - ${prayer.timeStr}`,
      sound: sound,
      data: { prayerName: prayer.name, time: prayer.timeStr, soundType },
    };

    if (Platform.OS === 'android') {
      notificationContent.priority = Notifications.AndroidNotificationPriority.MAX;
      (notificationContent as any).channelId = 'athan';
    }

    if (Platform.OS === 'ios') {
      (notificationContent as any).interruptionLevel = 'timeSensitive';
      notificationContent.categoryIdentifier = getIOSNotificationCategory(soundType);
    }

    console.log(`[Notifications] iOS content for ${prayer.name}:`, JSON.stringify({
      sound: notificationContent.sound,
      interruptionLevel: (notificationContent as any).interruptionLevel,
      categoryIdentifier: notificationContent.categoryIdentifier,
    }));

    const id = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
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
  soundType: NotificationSoundType = 'athan',
  latitude: number = 24.7136,
  longitude: number = 46.6753,
  offsets: Record<PrayerName, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Cleared all existing notifications, soundType:', soundType);

  let scheduledCount = 0;
  for (const prayer of prayers) {
    if (enabledPrayers[prayer.name]) {
      const id = await scheduleAthanNotification(prayer, true, soundType);
      if (id) scheduledCount++;
    }
  }

  if (scheduledCount === 0) {
    console.log('[Notifications] No future prayers today, scheduling tomorrow\'s prayers');
    await scheduleTomorrowNotifications(latitude, longitude, offsets, enabledPrayers, soundType);
  }
}

async function scheduleTomorrowNotifications(
  latitude: number,
  longitude: number,
  offsets: Record<PrayerName, number>,
  enabledPrayers: Record<PrayerName, boolean>,
  soundType: NotificationSoundType
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tz = getTimezoneOffset();

    const tomorrowPrayers = calculatePrayerTimes(tomorrow, latitude, longitude, tz, offsets);

    for (const prayer of tomorrowPrayers.prayers) {
      if (enabledPrayers[prayer.name]) {
        await scheduleAthanNotification(prayer, true, soundType);
      }
    }
    console.log('[Notifications] Tomorrow prayers scheduled');
  } catch (e) {
    console.error('[Notifications] Error scheduling tomorrow:', e);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] All notifications cancelled');
}
