import { Platform } from 'react-native';
import type { AthanSettings } from '@/contexts/AthanContext';
import { calculatePrayerTimes, getTimezoneOffset } from '@/utils/prayerTimes';
import { ALL_CITIES } from '@/constants/cities';
import type { AppLanguage } from '@/utils/i18n';

const APP_GROUP = 'group.app.alsulaimani.athan';
let publishGeneration = 0;

export function publishWidgetData(settings: AthanSettings, language?: AppLanguage): void {
  if (Platform.OS !== 'ios') return;
  const generation = ++publishGeneration;

  try {
    const { ExtensionStorage } = require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
    const prayers: Array<Record<string, string | number>> = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 12; dayOffset += 1) {
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
          time: prayer.time.getTime() / 1000,
          timeText: prayer.timeStr,
        });
      });
    }

    const city = ALL_CITIES.find((item) =>
      item.name === settings.locationName || item.nameAr === settings.locationName ||
      (Math.abs(item.latitude - settings.latitude) < 0.002 && Math.abs(item.longitude - settings.longitude) < 0.002)
    );
    const values = {
      locationName: settings.locationName,
      locationNameAr: city?.nameAr ?? settings.locationName,
      locationNameEn: city?.name ?? settings.locationName,
      prayers,
      lastUpdated: Math.floor(Date.now() / 1000),
    };

    const writeAndReload = () => {
      if (generation !== publishGeneration) return;
      const storage = new ExtensionStorage(APP_GROUP);
      storage.set('locationName', values.locationName);
      storage.set('locationNameAr', values.locationNameAr);
      storage.set('locationNameEn', values.locationNameEn);
      if (language) storage.set('appLanguage', language);
      // Arrays are stored by the native module as Data in the App Group.
      // Reading that Data directly in Swift avoids string/JSON bridging issues.
      storage.set('prayersData', values.prayers);
      storage.set('lastUpdated', values.lastUpdated);
      ExtensionStorage.reloadWidget();
    };

    // App Group UserDefaults are shared across two processes. Reload once
    // immediately, then repeat after the values have had time to propagate so
    // a newly installed/re-added widget cannot remain on its placeholder.
    writeAndReload();
    setTimeout(writeAndReload, 750);
    setTimeout(writeAndReload, 2_500);
  } catch (error) {
    console.error('[WidgetData] Failed to update widget:', error);
  }
}
