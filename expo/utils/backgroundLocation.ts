import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import type { AthanSettings } from '@/contexts/AthanContext';
import { calculatePrayerTimes, getDeviceTimezoneId, getTimezoneOffset } from '@/utils/prayerTimes';
import { scheduleAllNotifications, showLocationUpdatedNotification } from '@/utils/notifications';
import { publishWidgetData } from '@/utils/widgetData';
import { ALL_CITIES } from '@/constants/cities';
import { AppLanguage, getStoredLanguage, translate } from '@/utils/i18n';

export const BACKGROUND_LOCATION_TASK = 'athan-significant-location-change';
export const ATHAN_SETTINGS_STORAGE_KEY = 'athan_settings_v3';
const MINIMUM_TRAVEL_DISTANCE_METERS = 10_000;

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

type ResolvedLocation = {
  name: string;
  countryCode?: string;
};

const COUNTRY_CODES: Record<string, string> = {
  Algeria: 'DZ',
  Bahrain: 'BH',
  Comoros: 'KM',
  Djibouti: 'DJ',
  Egypt: 'EG',
  Iraq: 'IQ',
  Jordan: 'JO',
  Kuwait: 'KW',
  Lebanon: 'LB',
  Libya: 'LY',
  Mauritania: 'MR',
  Morocco: 'MA',
  Oman: 'OM',
  Palestine: 'PS',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  Somalia: 'SO',
  Sudan: 'SD',
  Syria: 'SY',
  Tunisia: 'TN',
  UAE: 'AE',
  Yemen: 'YE',
};

function countryCodeToFlag(countryCode?: string | null): string {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return '';
  return String.fromCodePoint(
    ...Array.from(normalized).map((character) => 0x1F1E6 + character.charCodeAt(0) - 65)
  );
}

function formatLocationWithFlag(location: ResolvedLocation): string {
  const flag = countryCodeToFlag(location.countryCode);
  return flag ? `${location.name} ${flag}` : location.name;
}

function normalizeLocationName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function distanceInMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB))
    * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveLocation(latitude: number, longitude: number, language: AppLanguage = 'ar'): Promise<ResolvedLocation> {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = addresses[0];
    if (address) {
      return {
        name: address.city
        || address.district
        || address.subregion
        || address.region
        || address.country
        || translate(language, 'newArea'),
        countryCode: address.isoCountryCode || undefined,
      };
    }
  } catch (error) {
    console.log('[BackgroundLocation] Reverse geocode failed:', error);
  }

  // Reverse geocoding can require a network connection. Fall back to the
  // bundled city list so travel updates still have a useful Arabic name when
  // the device is offline.
  const nearestCity = ALL_CITIES.reduce<ResolvedLocation & { distance: number } | null>((nearest, city) => {
    const distance = distanceInMeters(latitude, longitude, city.latitude, city.longitude);
    if (!nearest || distance < nearest.distance) {
      return {
        name: language === 'ar' ? city.nameAr : city.name,
        countryCode: COUNTRY_CODES[city.country],
        distance,
      };
    }
    return nearest;
  }, null);

  // Avoid naming a distant city when the user is outside the bundled coverage.
  return nearestCity && nearestCity.distance <= 150_000
    ? nearestCity
    : { name: translate(language, 'yourCurrentLocation') };
}

export async function resolveLocationName(latitude: number, longitude: number, language: AppLanguage = 'ar'): Promise<string> {
  return (await resolveLocation(latitude, longitude, language)).name;
}

TaskManager.defineTask<LocationTaskData>(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) {
    if (error) console.error('[BackgroundLocation] Task error:', error);
    return;
  }

  try {
    const stored = await AsyncStorage.getItem(ATHAN_SETTINGS_STORAGE_KEY);
    if (!stored) return;
    const settings = JSON.parse(stored) as AthanSettings;
    if (!settings.backgroundLocationEnabled || settings.locationMode !== 'auto') return;

    const latest = data.locations[data.locations.length - 1];
    const latitude = latest.coords.latitude;
    const longitude = latest.coords.longitude;
    const travelled = distanceInMeters(settings.latitude, settings.longitude, latitude, longitude);
    if (travelled < MINIMUM_TRAVEL_DISTANCE_METERS) return;

    const language = await getStoredLanguage();
    const resolvedLocation = await resolveLocation(latitude, longitude, language);
    const locationName = resolvedLocation.name;
    const timezoneId = getDeviceTimezoneId();
    const timezone = getTimezoneOffset(new Date(), timezoneId);

    // Resolving a place name can take long enough for the user to disable
    // travel updates or select a manual city. Re-read the settings so this
    // background task never restores tracking with a stale snapshot.
    const latestStored = await AsyncStorage.getItem(ATHAN_SETTINGS_STORAGE_KEY);
    if (!latestStored) return;
    const latestSettings = JSON.parse(latestStored) as AthanSettings;
    if (!latestSettings.backgroundLocationEnabled || latestSettings.locationMode !== 'auto') return;

    const locationNameChanged = normalizeLocationName(latestSettings.locationName)
      !== normalizeLocationName(locationName);

    const updatedSettings: AthanSettings = {
      ...latestSettings,
      latitude,
      longitude,
      timezone,
      timezoneId,
      locationName,
      locationMode: 'auto',
    };

    await AsyncStorage.setItem(ATHAN_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    publishWidgetData(updatedSettings, language);

    if (updatedSettings.globalEnabled) {
      const prayers = calculatePrayerTimes(
        new Date(),
        latitude,
        longitude,
        timezone,
        updatedSettings.offsets
      );
      await scheduleAllNotifications(
        prayers.prayers,
        updatedSettings.enabledPrayers,
        updatedSettings.notificationSound,
        latitude,
        longitude,
        updatedSettings.offsets,
        language,
        timezone,
        timezoneId
      );
      if (locationNameChanged) {
        await showLocationUpdatedNotification(formatLocationWithFlag(resolvedLocation), language);
      }
    }
  } catch (taskError) {
    console.error('[BackgroundLocation] Failed to update location:', taskError);
  }
});

export async function startBackgroundLocationUpdates(): Promise<void> {
  if (Platform.OS === 'web') return;
  const language = await getStoredLanguage();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: MINIMUM_TRAVEL_DISTANCE_METERS,
    deferredUpdatesDistance: MINIMUM_TRAVEL_DISTANCE_METERS,
    deferredUpdatesInterval: 30 * 60 * 1000,
    pausesUpdatesAutomatically: true,
    activityType: Location.ActivityType.Other,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: translate(language, 'appName'),
      notificationBody: translate(language, 'backgroundUpdate'),
      notificationColor: '#C9A84C',
    },
  });
}

export async function stopBackgroundLocationUpdates(): Promise<void> {
  if (Platform.OS === 'web') return;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
