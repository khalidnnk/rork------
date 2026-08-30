import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import type { AthanSettings } from '@/contexts/AthanContext';
import { calculatePrayerTimes, getTimezoneOffset } from '@/utils/prayerTimes';
import { scheduleAllNotifications, showLocationUpdatedNotification } from '@/utils/notifications';
import { publishWidgetData } from '@/utils/widgetData';

export const BACKGROUND_LOCATION_TASK = 'athan-significant-location-change';
export const ATHAN_SETTINGS_STORAGE_KEY = 'athan_settings_v3';
const MINIMUM_TRAVEL_DISTANCE_METERS = 10_000;

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

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

export async function resolveLocationName(latitude: number, longitude: number): Promise<string> {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = addresses[0];
    if (address) {
      return address.city
        || address.district
        || address.subregion
        || address.region
        || address.country
        || 'المنطقة الجديدة';
    }
  } catch (error) {
    console.log('[BackgroundLocation] Reverse geocode failed:', error);
  }
  return 'المنطقة الجديدة';
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

    const locationName = await resolveLocationName(latitude, longitude);
    const timezone = getTimezoneOffset();
    const updatedSettings: AthanSettings = {
      ...settings,
      latitude,
      longitude,
      timezone,
      locationName,
      locationMode: 'auto',
    };

    await AsyncStorage.setItem(ATHAN_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    publishWidgetData(updatedSettings);

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
        updatedSettings.offsets
      );
      await showLocationUpdatedNotification(locationName);
    }
  } catch (taskError) {
    console.error('[BackgroundLocation] Failed to update location:', taskError);
  }
});

export async function startBackgroundLocationUpdates(): Promise<void> {
  if (Platform.OS === 'web') return;
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
      notificationTitle: 'أذان السليماني',
      notificationBody: 'تحديث مواقيت الصلاة تلقائيًا عند السفر',
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
