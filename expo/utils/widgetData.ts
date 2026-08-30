import { Platform } from 'react-native';
import type { AthanSettings } from '@/contexts/AthanContext';
import { calculatePrayerTimes, getTimezoneOffset } from '@/utils/prayerTimes';
import { ALL_CITIES } from '@/constants/cities';
import type { AppLanguage } from '@/utils/i18n';

const APP_GROUP = 'group.app.alsulaimani.athan';
const WIDGET_KIND = 'AlsulaimaniPrayerWidget';

export function publishWidgetData(settings: AthanSettings, language?: AppLanguage): void {
  if (Platform.OS !== 'ios') return;

  try {
    const { ExtensionStorage } = require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
    const storage = new ExtensionStorage(APP_GROUP);
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
    storage.set('locationName', settings.locationName);
    storage.set('locationNameAr', city?.nameAr ?? settings.locationName);
    storage.set('locationNameEn', city?.name ?? settings.locationName);
    if (language) storage.set('appLanguage', language);
    storage.set('prayersJSON', JSON.stringify(prayers));
    storage.set('lastUpdated', Date.now() / 1000);
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (error) {
    console.error('[WidgetData] Failed to update widget:', error);
  }
}
