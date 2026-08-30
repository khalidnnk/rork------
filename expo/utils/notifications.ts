import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTime, PrayerName, calculatePrayerTimes, getTimezoneOffset } from './prayerTimes';
import type { NotificationSoundType } from '@/contexts/AthanContext';

let notificationSchedulingQueue: Promise<void> = Promise.resolve();
let latestSchedulingRequest = 0;
const NOTIFICATION_SCHEDULE_DAYS = 12;
const RENEWAL_REMINDER_DAYS = 10;

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
      return 'haya_ala_salah.m4a';
    case 'full_athan':
      return 'athan.m4a';
    case 'allahu_akbar':
      return 'allahu_akbar.m4a';
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
    case 'allahu_akbar':
      return 'athan_akbar';
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
    await Notifications.setNotificationCategoryAsync('athan_akbar', [
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
    const dateKey = [
      prayer.time.getFullYear(),
      String(prayer.time.getMonth() + 1).padStart(2, '0'),
      String(prayer.time.getDate()).padStart(2, '0'),
    ].join('');
    const identifier = `athan-${prayer.name}-${dateKey}`;

    const notificationContent: Notifications.NotificationContentInput = {
      title: `حان وقت صلاة ${prayer.labelAr}`,
      body: soundType === 'full_athan'
        ? `${prayer.label} - ${prayer.timeStr} | افتح للاستماع للأذان كاملاً`
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
      identifier,
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

async function scheduleRenewalReminder(fromDate: Date): Promise<void> {
  const reminderDate = new Date(fromDate);
  reminderDate.setDate(reminderDate.getDate() + RENEWAL_REMINDER_DAYS);
  reminderDate.setHours(19, 0, 0, 0);

  const secondsUntil = Math.max(
    1,
    Math.floor((reminderDate.getTime() - Date.now()) / 1000)
  );
  const reason = Platform.OS === 'ios'
    ? 'السبب: نظام iPhone يحد عدد التنبيهات التي يمكن جدولتها مسبقًا، وفتح التطبيق يجددها تلقائيًا.'
    : 'السبب: فتح التطبيق يجدد جدول تنبيهات الأذان تلقائيًا.';

  await Notifications.scheduleNotificationAsync({
    identifier: 'athan-renewal-reminder',
    content: {
      title: 'تجديد تنبيهات الأذان 🤍',
      body: `افتح التطبيق لتجديد التنبيهات للأيام القادمة.\n${reason}`,
      sound: 'default',
      data: { type: 'renewal-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
    },
  });
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

  const requestId = ++latestSchedulingRequest;
  const schedulingTask = notificationSchedulingQueue.then(async () => {
    if (requestId !== latestSchedulingRequest) {
      console.log('[Notifications] Skipping stale scheduling request:', requestId);
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cleared all existing notifications, soundType:', soundType);

    let scheduledCount = 0;
    const today = new Date();
    for (let dayOffset = 0; dayOffset < NOTIFICATION_SCHEDULE_DAYS; dayOffset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dayPrayers = dayOffset === 0
        ? prayers
        : calculatePrayerTimes(date, latitude, longitude, getTimezoneOffset(), offsets).prayers;

      for (const prayer of dayPrayers) {
        if (requestId !== latestSchedulingRequest) {
          console.log('[Notifications] Scheduling request superseded:', requestId);
          return;
        }
        if (enabledPrayers[prayer.name]) {
          const id = await scheduleAthanNotification(prayer, true, soundType);
          if (id) scheduledCount += 1;
        }
      }
    }

    if (requestId !== latestSchedulingRequest) return;
    await scheduleRenewalReminder(today);

    console.log(`[Notifications] Scheduled ${scheduledCount} Athan alerts across ${NOTIFICATION_SCHEDULE_DAYS} days plus renewal reminder`);
  });

  notificationSchedulingQueue = schedulingTask.catch((error) => {
    console.error('[Notifications] Scheduling queue error:', error);
  });

  await schedulingTask;
}

export async function showLocationUpdatedNotification(locationName: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'أذان السليماني',
      body: `نوّرت ${locationName} 🤍، وتم تحديث مواقيت الصلاة حسب موقعك الحالي.`,
      sound: true,
      data: { type: 'location-updated', locationName },
    },
    trigger: null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  const requestId = ++latestSchedulingRequest;
  const cancellationTask = notificationSchedulingQueue.then(async () => {
    if (requestId !== latestSchedulingRequest) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All notifications cancelled');
  });

  notificationSchedulingQueue = cancellationTask.catch((error) => {
    console.error('[Notifications] Cancellation queue error:', error);
  });

  await cancellationTask;
}
