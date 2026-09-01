import { Platform } from 'react-native';
import type { AthanSettings } from '@/contexts/AthanContext';
import { calculatePrayerTimes, getTimezoneOffset } from '@/utils/prayerTimes';
import { ALL_CITIES } from '@/constants/cities';
import type { AppLanguage } from '@/utils/i18n';

const APP_GROUP = 'group.app.alsulaimani.athan';
const WIDGET_KIND = 'AlsulaimaniPrayerWidget';
const SCHEDULE_DAYS = 14;
const WIDGET_SCHEMA_VERSION = 2;
let publishGeneration = 0;

type WidgetPrayer = {
  name: string;
  labelAr: string;
  time: number;
  timeText: string;
};

export function publishWidgetData(settings: AthanSettings, language?: AppLanguage): void {
  if (Platform.OS !== 'ios') return;
  const generation = ++publishGeneration;

  try {
    const { ExtensionStorage } = require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
    const prayers: WidgetPrayer[] = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const daily = calculatePrayerTimes(
        date,
        settings.latitude,
        settings.longitude,
        getTimezoneOffset(),
        settings.offsets
      );

      daily.prayers.forEach((prayer) => {
        prayers.push({
          name: prayer.name,
          labelAr: prayer.labelAr,
          time: Math.floor(prayer.time.getTime() / 1000),
          timeText: prayer.timeStr,
        });
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const upcomingPrayers = prayers.filter((prayer) => prayer.time > now);
    const nextPrayer = upcomingPrayers[0];

    const city = ALL_CITIES.find((item) =>
      item.name === settings.locationName
      || item.nameAr === settings.locationName
      || (
        Math.abs(item.latitude - settings.latitude) < 0.002
        && Math.abs(item.longitude - settings.longitude) < 0.002
      )
    );

    const locationNameAr = city?.nameAr ?? settings.locationName;
    const locationNameEn = city?.name ?? settings.locationName;
    const lastUpdated = Math.floor(Date.now() / 1000);

    const writeAndReload = () => {
      if (generation !== publishGeneration) return;

      const storage = new ExtensionStorage(APP_GROUP);
      storage.set('widgetSchemaVersion', WIDGET_SCHEMA_VERSION);
      storage.set('locationName', settings.locationName);
      storage.set('locationNameAr', locationNameAr);
      storage.set('locationNameEn', locationNameEn);
      if (language) storage.set('appLanguage', language);

      // ExtensionStorage serializes arrays as JSON Data in the App Group.
      // Keeping the complete schedule lets WidgetKit advance prayer-by-prayer
      // for days without reopening the React Native application.
      storage.set('prayerSchedule', upcomingPrayers);

      if (nextPrayer) {
        storage.set('nextPrayerName', nextPrayer.name);
        storage.set('nextPrayerLabelAr', nextPrayer.labelAr);
        storage.set('nextPrayerTime', nextPrayer.time);
        storage.set('nextPrayerTimeText', nextPrayer.timeText);
      } else {
        storage.remove('nextPrayerName');
        storage.remove('nextPrayerLabelAr');
        storage.remove('nextPrayerTime');
        storage.remove('nextPrayerTimeText');
      }

      storage.set('widgetDataReady', 1);
      storage.set('lastUpdated', lastUpdated);
      ExtensionStorage.reloadWidget(WIDGET_KIND);
    };

    writeAndReload();
    setTimeout(writeAndReload, 750);
    setTimeout(writeAndReload, 2_500);
  } catch (error) {
    console.error('[WidgetData] Failed to update widget:', error);
  }
}
