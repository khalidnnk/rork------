import { Platform } from 'react-native';
import type { AthanSettings } from '@/contexts/AthanContext';
import { calculatePrayerTimes, getTimezoneOffset } from '@/utils/prayerTimes';

const APP_GROUP = 'group.app.alsulaimani.athan';
const WIDGET_KIND = 'AlsulaimaniPrayerWidget';

export function publishWidgetData(settings: AthanSettings): void {
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

    storage.set('locationName', settings.locationName);
    storage.set('prayersJSON', JSON.stringify(prayers));
    storage.set('lastUpdated', Date.now() / 1000);
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (error) {
    console.error('[WidgetData] Failed to update widget:', error);
  }
}
