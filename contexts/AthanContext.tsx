import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  PrayerName,
  PrayerTime,
  DailyPrayers,
  calculatePrayerTimes,
  getNextPrayer,
  getTimezoneOffset,
} from '@/utils/prayerTimes';
import {
  requestNotificationPermissions,
  scheduleAllNotifications,
} from '@/utils/notifications';

const STORAGE_KEY = 'athan_settings_v2';

export interface AthanSettings {
  globalEnabled: boolean;
  enabledPrayers: Record<PrayerName, boolean>;
  offsets: Record<PrayerName, number>;
  locationName: string;
  latitude: number;
  longitude: number;
  timezone: number;
  locationMode: 'auto' | 'manual';
  hasSeenWelcome: boolean;
}

const DEFAULT_SETTINGS: AthanSettings = {
  globalEnabled: true,
  enabledPrayers: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  offsets: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  locationName: 'جارٍ تحديد الموقع...',
  latitude: 21.4225,
  longitude: 39.8262,
  timezone: 3,
  locationMode: 'auto' as const,
  hasSeenWelcome: false,
};

async function loadSettings(): Promise<AthanSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('[AthanContext] Error loading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings: AthanSettings): Promise<AthanSettings> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log('[AthanContext] Settings saved');
  } catch (e) {
    console.error('[AthanContext] Error saving settings:', e);
  }
  return settings;
}

export const [AthanProvider, useAthan] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AthanSettings>(DEFAULT_SETTINGS);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState<boolean>(false);

  const settingsQuery = useQuery({
    queryKey: ['athan-settings'],
    queryFn: loadSettings,
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['athan-settings'], data);
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const updateSettings = useCallback(
    (partial: Partial<AthanSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      saveMutation.mutate(updated);
    },
    [settings, saveMutation]
  );

  const togglePrayer = useCallback(
    (name: PrayerName) => {
      const updated = {
        ...settings,
        enabledPrayers: {
          ...settings.enabledPrayers,
          [name]: !settings.enabledPrayers[name],
        },
      };
      setSettings(updated);
      saveMutation.mutate(updated);
    },
    [settings, saveMutation]
  );

  const setOffset = useCallback(
    (name: PrayerName, offset: number) => {
      const updated = {
        ...settings,
        offsets: {
          ...settings.offsets,
          [name]: offset,
        },
      };
      setSettings(updated);
      saveMutation.mutate(updated);
    },
    [settings, saveMutation]
  );

  const toggleGlobal = useCallback(() => {
    updateSettings({ globalEnabled: !settings.globalEnabled });
  }, [settings.globalEnabled, updateSettings]);

  const dismissWelcome = useCallback(() => {
    updateSettings({ hasSeenWelcome: true });
  }, [updateSettings]);

  useEffect(() => {
    if (settings.locationMode !== 'auto') {
      setLocationLoading(false);
      return;
    }

    let cancelled = false;

    async function detectLocation() {
      try {
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                if (cancelled) return;
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const tz = getTimezoneOffset();
                updateSettings({
                  latitude: lat,
                  longitude: lng,
                  timezone: tz,
                  locationName: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
                });
                setLocationLoading(false);
              },
              () => {
                if (cancelled) return;
                console.log('[AthanContext] Web geolocation denied, using defaults');
                updateSettings({ locationName: 'مكة المكرمة' });
                setLocationLoading(false);
              }
            );
          } else {
            updateSettings({ locationName: 'مكة المكرمة' });
            setLocationLoading(false);
          }
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) {
          console.log('[AthanContext] Location permission denied');
          updateSettings({ locationName: 'مكة المكرمة' });
          setLocationLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        const tz = getTimezoneOffset();

        let locationName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        try {
          const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (addresses.length > 0 && !cancelled) {
            const addr = addresses[0];
            locationName = [addr.city, addr.country].filter(Boolean).join(', ');
          }
        } catch (e) {
          console.log('[AthanContext] Reverse geocode failed:', e);
        }

        if (!cancelled) {
          updateSettings({
            latitude: lat,
            longitude: lng,
            timezone: tz,
            locationName,
          });
          setLocationLoading(false);
        }
      } catch (e) {
        console.error('[AthanContext] Location error:', e);
        if (!cancelled) {
          updateSettings({ locationName: 'مكة المكرمة' });
          setLocationLoading(false);
        }
      }
    }

    detectLocation();
    return () => { cancelled = true; };
  }, [settings.locationMode]);

  const dailyPrayers = useMemo<DailyPrayers>(() => {
    return calculatePrayerTimes(
      new Date(),
      settings.latitude,
      settings.longitude,
      settings.timezone,
      settings.offsets
    );
  }, [settings.latitude, settings.longitude, settings.timezone, settings.offsets]);

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const nextPrayer = useMemo<PrayerTime | null>(() => {
    console.log('[AthanContext] Recalculating next prayer at', new Date(now).toLocaleTimeString());
    return getNextPrayer(dailyPrayers.prayers);
  }, [dailyPrayers, now]);

  useEffect(() => {
    if (!settings.globalEnabled || Platform.OS === 'web') return;

    async function scheduleNotifs() {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleAllNotifications(dailyPrayers.prayers, settings.enabledPrayers);
      }
    }

    scheduleNotifs();
  }, [dailyPrayers, settings.enabledPrayers, settings.globalEnabled]);

  return {
    settings,
    updateSettings,
    togglePrayer,
    setOffset,
    toggleGlobal,
    dismissWelcome,
    dailyPrayers,
    nextPrayer,
    locationLoading,
    isLoading: settingsQuery.isLoading,
    isAdhanPlaying,
    setIsAdhanPlaying,
  };
});
