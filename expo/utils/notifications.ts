import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  PrayerTime,
  PrayerName,
  calculatePrayerTimes,
  getTimezoneOffset,
  isJumuahPrayer,
} from './prayerTimes';
import type { NotificationSoundType } from '@/utils/notificationTypes';
import { AppLanguage, getStoredLanguage, translate } from '@/utils/i18n';

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
    case 'allahu_akbar':
      return 'allahu_akbar.m4a';
    case 'default':
      return true;
    case 'silent':
      return false;
  }
}

export async function requestNotificationPermissions(language?: AppLanguage): Promise<boolean> {
  language ??= await getStoredLanguage();
  if (Platform.OS === 'web') return false;

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
  }

  if (finalStatus !== 'granted') return false;

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

  return true;
}

export async function scheduleAthanNotification(
  prayer: PrayerTime,
  enabled: boolean,
  soundType: NotificationSoundType = 'athan',
  language?: AppLanguage
): Promise<string | null> {
  language ??= await getStoredLanguage();
  if (Platform.OS === 'web' || !enabled) return null;

  const now = new Date();
  if (prayer.time <= now) return null;

  const secondsUntil = Math.floor((prayer.time.getTime() - now.getTime()) / 1000);
  const sound = getNotificationSound(soundType);

  try {
    const dateKey = [
      prayer.time.getFullYear(),
      String(prayer.time.getMonth() + 1).padStart(2, '0'),
      String(prayer.time.getDate()).padStart(2, '0'),
    ].join('');
    const identifier = `athan-${prayer.name}-${dateKey}`;

    const localizedPrayerLabel = language === 'ar' ? prayer.labelAr : prayer.label;
    const notificationContent: Notifications.NotificationContentInput = {
      title: isJumuahPrayer(prayer.name, prayer.time)
        ? translate(language, 'jumuahPrayerTimeTitle')
        : translate(language, 'prayerTimeTitle', { prayer: localizedPrayerLabel }),
      body: translate(language, 'prayerBody', {
        prayer: localizedPrayerLabel,
        time: prayer.timeStr,
      }),
      sound,
      // Keep notification data informational only. Tapping an alert opens the
      // same visible app UI and never unlocks or starts another feature.
      data: { prayerName: prayer.name, time: prayer.timeStr },
    };

    if (Platform.OS === 'android') {
      notificationContent.priority = Notifications.AndroidNotificationPriority.MAX;
      (notificationContent as any).channelId = 'athan';
    }

    return await Notifications.scheduleNotificationAsync({
      identifier,
      content: notificationContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsUntil),
      },
    });
  } catch (error) {
    console.error(`[Notifications] Error scheduling ${prayer.name}:`, error);
    return null;
  }
}

async function scheduleRenewalReminder(fromDate: Date, language: AppLanguage): Promise<void> {
  const reminderDate = new Date(fromDate);
  reminderDate.setDate(reminderDate.getDate() + RENEWAL_REMINDER_DAYS);
  reminderDate.setHours(19, 0, 0, 0);

  const secondsUntil = Math.max(
    1,
    Math.floor((reminderDate.getTime() - Date.now()) / 1000)
  );
  const reason = translate(
    language,
    Platform.OS === 'ios' ? 'renewalReasonIos' : 'renewalReasonOther'
  );

  await Notifications.scheduleNotificationAsync({
    identifier: 'athan-renewal-reminder',
    content: {
      title: translate(language, 'renewalTitle'),
      body: translate(language, 'renewalBody', { reason }),
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
  offsets: Record<PrayerName, number> = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  language?: AppLanguage,
  timezone: number = getTimezoneOffset(),
  timezoneId?: string
): Promise<void> {
  if (Platform.OS === 'web') return;
  language ??= await getStoredLanguage();

  const requestId = ++latestSchedulingRequest;
  const schedulingTask = notificationSchedulingQueue.then(async () => {
    if (requestId !== latestSchedulingRequest) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const today = new Date();
    for (let dayOffset = 0; dayOffset < NOTIFICATION_SCHEDULE_DAYS; dayOffset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dayPrayers = dayOffset === 0
        ? prayers
        : calculatePrayerTimes(
          date,
          latitude,
          longitude,
          getTimezoneOffset(date, timezoneId, timezone),
          offsets
        ).prayers;

      for (const prayer of dayPrayers) {
        if (requestId !== latestSchedulingRequest) return;
        if (enabledPrayers[prayer.name]) {
          await scheduleAthanNotification(prayer, true, soundType, language);
        }
      }
    }

    if (requestId !== latestSchedulingRequest) return;
    await scheduleRenewalReminder(today, language);
  });

  notificationSchedulingQueue = schedulingTask.catch((error) => {
    console.error('[Notifications] Scheduling queue error:', error);
  });

  await schedulingTask;
}

export async function showLocationUpdatedNotification(
  locationName: string,
  language?: AppLanguage
): Promise<void> {
  if (Platform.OS === 'web') return;
  language ??= await getStoredLanguage();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate(language, 'appName'),
      body: translate(language, 'locationUpdated', { location: locationName }),
      sound: true,
      data: { type: 'location-updated' },
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
  });

  notificationSchedulingQueue = cancellationTask.catch((error) => {
    console.error('[Notifications] Cancellation queue error:', error);
  });

  await cancellationTask;
}
