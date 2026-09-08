import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Asset } from 'expo-asset';
import {
  DailyPrayers,
  PrayerName,
  PrayerTime,
  calculatePrayerTimes,
  getDateKey,
  getDeviceTimezoneId,
  getNextPrayerWithTomorrow,
  getTimezoneOffset,
} from '@/utils/prayerTimes';
import {
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleAllNotifications,
} from '@/utils/notifications';
import {
  ATHAN_SETTINGS_STORAGE_KEY,
  resolveLocationName,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '@/utils/backgroundLocation';
import { publishWidgetData } from '@/utils/widgetData';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  normalizeNotificationSound,
  type NotificationSoundType,
} from '@/utils/notificationTypes';

export type { NotificationSoundType } from '@/utils/notificationTypes';

const STORAGE_KEY = ATHAN_SETTINGS_STORAGE_KEY;
const FULL_ATHAN_MAX_DURATION_SECONDS = 300;

const fullAthanModule = require('@/assets/audio/athan.m4a');
const hayaModule = require('@/assets/audio/haya_ala_salah.m4a');
const allahuAkbarModule = require('@/assets/audio/allahu_akbar.m4a');

function bundledAudioSource(moduleRef: number): { uri: string } {
  return { uri: Asset.fromModule(moduleRef).uri };
}

export interface AthanSettings {
  globalEnabled: boolean;
  enabledPrayers: Record<PrayerName, boolean>;
  offsets: Record<PrayerName, number>;
  locationName: string;
  latitude: number;
  longitude: number;
  timezone: number;
  timezoneId?: string;
  locationMode: 'auto' | 'manual';
  backgroundLocationEnabled: boolean;
  hasSeenWelcome: boolean;
  notificationSound: NotificationSoundType;
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
  locationName: 'الرياض',
  latitude: 24.7136,
  longitude: 46.6753,
  timezone: 3,
  timezoneId: 'Asia/Riyadh',
  locationMode: 'auto',
  backgroundLocationEnabled: false,
  hasSeenWelcome: false,
  notificationSound: 'athan',
};

async function loadSettings(): Promise<AthanSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored) as Partial<AthanSettings> & {
      notificationSound?: unknown;
    };

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      enabledPrayers: {
        ...DEFAULT_SETTINGS.enabledPrayers,
        ...(parsed.enabledPrayers ?? {}),
      },
      offsets: {
        ...DEFAULT_SETTINGS.offsets,
        ...(parsed.offsets ?? {}),
      },
      // Legacy or unknown values are deliberately collapsed to a visible,
      // supported notification option. Full Athan is manual in-app playback
      // only and is never a notification mode.
      notificationSound: normalizeNotificationSound(parsed.notificationSound),
    };
  } catch (error) {
    console.error('[AthanContext] Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: AthanSettings): Promise<AthanSettings> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export const [AthanProvider, useAthan] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  const [settings, setSettings] = useState<AthanSettings>(DEFAULT_SETTINGS);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewingSoundType, setPreviewingSoundType] = useState<NotificationSoundType | null>(null);

  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoDetected = useRef(false);

  const fullAthanSource = useMemo(() => bundledAudioSource(fullAthanModule), []);
  const hayaSource = useMemo(() => bundledAudioSource(hayaModule), []);
  const allahuAkbarSource = useMemo(() => bundledAudioSource(allahuAkbarModule), []);

  // The audio player exists only for controls that are visible inside the app:
  // manual Full Athan playback and short notification-sound previews.
  const player = useAudioPlayer(fullAthanSource);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch((error) => {
      console.error('[AthanContext] Audio mode setup failed:', error);
    });
  }, []);

  useEffect(() => {
    if (!playerStatus.didJustFinish) return;
    setIsAdhanPlaying(false);
    setIsPreviewPlaying(false);
    setPreviewingSoundType(null);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, [playerStatus.didJustFinish]);

  const stopPlayerTimers = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const waitForLoaded = useCallback(async (maxWaitMs = 5000): Promise<boolean> => {
    if (player.isLoaded) return true;
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (player.isLoaded) return true;
    }
    return false;
  }, [player]);

  const playSource = useCallback(async (source: { uri: string }): Promise<boolean> => {
    try {
      player.pause();
      player.replace(source);
      if (!await waitForLoaded()) return false;
      try {
        await player.seekTo(0);
      } catch {
        // The source is still safe to play from its initial position.
      }
      player.volume = 1;
      player.muted = false;
      player.play();
      return true;
    } catch (error) {
      console.error('[AthanContext] Audio playback failed:', error);
      return false;
    }
  }, [player, waitForLoaded]);

  const playAthan = useCallback(async () => {
    stopPlayerTimers();
    setIsPreviewPlaying(false);
    setPreviewingSoundType(null);
    setIsAdhanPlaying(true);

    const started = await playSource(fullAthanSource);
    if (!started) {
      setIsAdhanPlaying(false);
      return;
    }

    stopTimerRef.current = setTimeout(() => {
      try {
        player.pause();
      } catch {
        // No-op if playback has already stopped.
      }
      setIsAdhanPlaying(false);
      stopTimerRef.current = null;
    }, FULL_ATHAN_MAX_DURATION_SECONDS * 1000);
  }, [fullAthanSource, playSource, player, stopPlayerTimers]);

  const stopAthan = useCallback(() => {
    try {
      player.pause();
    } catch {
      // No-op if playback is already stopped.
    }
    stopPlayerTimers();
    setIsAdhanPlaying(false);
    setIsPreviewPlaying(false);
    setPreviewingSoundType(null);
  }, [player, stopPlayerTimers]);

  const previewSound = useCallback(async (soundType: NotificationSoundType) => {
    if (soundType === 'silent') return;

    if (isPreviewPlaying || isAdhanPlaying) {
      stopAthan();
      return;
    }

    setIsPreviewPlaying(true);
    setPreviewingSoundType(soundType);

    try {
      if (soundType === 'default') {
        if (Platform.OS !== 'web') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: t('previewTitle'),
              body: t('previewBody'),
              sound: 'default',
            },
            trigger: null,
          });
        }
        previewTimerRef.current = setTimeout(() => {
          setIsPreviewPlaying(false);
          setPreviewingSoundType(null);
          previewTimerRef.current = null;
        }, 1500);
        return;
      }

      const source = soundType === 'allahu_akbar' ? allahuAkbarSource : hayaSource;
      const started = await playSource(source);
      if (!started) {
        setIsPreviewPlaying(false);
        setPreviewingSoundType(null);
        return;
      }

      const durationMs = soundType === 'allahu_akbar' ? 30_000 : 8_000;
      previewTimerRef.current = setTimeout(() => {
        try {
          player.pause();
        } catch {
          // No-op if playback has already stopped.
        }
        setIsPreviewPlaying(false);
        setPreviewingSoundType(null);
        previewTimerRef.current = null;
      }, durationMs);
    } catch (error) {
      console.error('[AthanContext] Sound preview failed:', error);
      setIsPreviewPlaying(false);
      setPreviewingSoundType(null);
    }
  }, [
    allahuAkbarSource,
    hayaSource,
    isAdhanPlaying,
    isPreviewPlaying,
    playSource,
    player,
    stopAthan,
    t,
  ]);

  const stopPreview = useCallback(() => {
    try {
      player.pause();
    } catch {
      // No-op if playback has already stopped.
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewingSoundType(null);
  }, [player]);

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
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const updateSettings = useCallback((partial: Partial<AthanSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...partial };
      saveMutation.mutate(next);
      return next;
    });
  }, [saveMutation]);

  const togglePrayer = useCallback((name: PrayerName) => {
    setSettings((previous) => {
      const next: AthanSettings = {
        ...previous,
        enabledPrayers: {
          ...previous.enabledPrayers,
          [name]: !previous.enabledPrayers[name],
        },
      };
      saveMutation.mutate(next);
      return next;
    });
  }, [saveMutation]);

  const setOffset = useCallback((name: PrayerName, offset: number) => {
    setSettings((previous) => {
      const next: AthanSettings = {
        ...previous,
        offsets: {
          ...previous.offsets,
          [name]: offset,
        },
      };
      saveMutation.mutate(next);
      return next;
    });
  }, [saveMutation]);

  const toggleGlobal = useCallback(() => {
    updateSettings({ globalEnabled: !settings.globalEnabled });
  }, [settings.globalEnabled, updateSettings]);

  const dismissWelcome = useCallback(() => {
    updateSettings({ hasSeenWelcome: true });
  }, [updateSettings]);

  const setLocation = useCallback((
    latitude: number,
    longitude: number,
    locationName: string,
    timezone: number
  ) => {
    updateSettings({
      latitude,
      longitude,
      locationName,
      timezone,
      locationMode: 'manual',
    });
    setLocationLoading(false);
  }, [updateSettings]);

  const detectAutoLocationSilent = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const timezoneId = getDeviceTimezoneId();
      const timezone = getTimezoneOffset();
      const locationName = await resolveLocationName(latitude, longitude, language);

      updateSettings({
        latitude,
        longitude,
        locationName,
        timezone,
        timezoneId,
        locationMode: 'auto',
      });
    } catch (error) {
      console.error('[AthanContext] Silent location refresh failed:', error);
    }
  }, [language, updateSettings]);

  useEffect(() => {
    const loadedSettings = settingsQuery.data;
    if (!loadedSettings || hasAutoDetected.current) return;
    hasAutoDetected.current = true;
    if (loadedSettings.locationMode === 'auto') {
      void detectAutoLocationSilent();
    }
  }, [detectAutoLocationSilent, settingsQuery.data]);

  const detectAutoLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'web') {
        setLocationLoading(false);
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const timezoneId = getDeviceTimezoneId();
      const timezone = getTimezoneOffset();
      const locationName = await resolveLocationName(latitude, longitude, language);

      updateSettings({
        latitude,
        longitude,
        locationName,
        timezone,
        timezoneId,
        locationMode: 'auto',
      });
    } catch (error) {
      console.error('[AthanContext] Location refresh failed:', error);
    } finally {
      setLocationLoading(false);
    }
  }, [language, updateSettings]);

  const setBackgroundLocationEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    if (!enabled) {
      await stopBackgroundLocationUpdates();
      updateSettings({ backgroundLocationEnabled: false });
      return true;
    }

    const foregroundPermission = await Location.requestForegroundPermissionsAsync();
    if (foregroundPermission.status !== 'granted') {
      updateSettings({ backgroundLocationEnabled: false });
      return false;
    }

    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    if (backgroundPermission.status !== 'granted') {
      updateSettings({ backgroundLocationEnabled: false });
      return false;
    }

    await startBackgroundLocationUpdates();
    updateSettings({
      backgroundLocationEnabled: true,
      locationMode: 'auto',
    });
    return true;
  }, [updateSettings]);

  useEffect(() => {
    if (Platform.OS === 'web' || settingsQuery.isLoading) return;
    if (!settings.backgroundLocationEnabled) return;

    void Location.getBackgroundPermissionsAsync()
      .then((permission) => {
        if (permission.status === 'granted') {
          return startBackgroundLocationUpdates();
        }
        updateSettings({ backgroundLocationEnabled: false });
      })
      .catch((error) => {
        console.error('[AthanContext] Background location restore failed:', error);
      });
  }, [settings.backgroundLocationEnabled, settingsQuery.isLoading, updateSettings]);

  const [dateKey, setDateKey] = useState(getDateKey());
  const [dailyPrayers, setDailyPrayers] = useState<DailyPrayers>(() => {
    const timezone = getTimezoneOffset(
      new Date(),
      DEFAULT_SETTINGS.timezoneId,
      DEFAULT_SETTINGS.timezone
    );
    return calculatePrayerTimes(
      new Date(),
      DEFAULT_SETTINGS.latitude,
      DEFAULT_SETTINGS.longitude,
      timezone,
      DEFAULT_SETTINGS.offsets
    );
  });
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);

  const recalculatePrayers = useCallback(() => {
    const now = new Date();
    const timezone = getTimezoneOffset(now, settings.timezoneId, settings.timezone);
    const prayers = calculatePrayerTimes(
      now,
      settings.latitude,
      settings.longitude,
      timezone,
      settings.offsets
    );
    setDailyPrayers(prayers);
    return prayers;
  }, [
    settings.latitude,
    settings.longitude,
    settings.offsets,
    settings.timezone,
    settings.timezoneId,
  ]);

  useEffect(() => {
    recalculatePrayers();
  }, [dateKey, recalculatePrayers]);

  useEffect(() => {
    if (settingsQuery.isLoading) return;
    publishWidgetData(settings, language);
  }, [language, settings, settingsQuery.isLoading]);

  useEffect(() => {
    const updateNextPrayer = () => {
      const now = new Date();
      const timezone = getTimezoneOffset(now, settings.timezoneId, settings.timezone);
      const result = getNextPrayerWithTomorrow(
        dailyPrayers.prayers,
        settings.latitude,
        settings.longitude,
        timezone,
        settings.offsets
      );
      setNextPrayer(result?.prayer ?? null);

      const nextDateKey = getDateKey();
      if (nextDateKey !== dateKey) setDateKey(nextDateKey);
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 3000);
    return () => clearInterval(interval);
  }, [
    dailyPrayers,
    dateKey,
    settings.latitude,
    settings.longitude,
    settings.offsets,
    settings.timezone,
    settings.timezoneId,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;

      void loadSettings().then((storedSettings) => {
        setSettings(storedSettings);
        publishWidgetData(storedSettings, language);
        setDailyPrayers(calculatePrayerTimes(
          new Date(),
          storedSettings.latitude,
          storedSettings.longitude,
          getTimezoneOffset(
            new Date(),
            storedSettings.timezoneId,
            storedSettings.timezone
          ),
          storedSettings.offsets
        ));
        if (storedSettings.locationMode === 'auto') {
          void detectAutoLocationSilent();
        }
      });
    });

    return () => subscription.remove();
  }, [detectAutoLocationSilent, language]);

  useEffect(() => {
    if (Platform.OS === 'web' || settingsQuery.isLoading) return;

    if (!settings.globalEnabled) {
      void cancelAllNotifications();
      return;
    }

    void (async () => {
      const granted = await requestNotificationPermissions(language);
      if (!granted) return;

      await scheduleAllNotifications(
        dailyPrayers.prayers,
        settings.enabledPrayers,
        settings.notificationSound,
        settings.latitude,
        settings.longitude,
        settings.offsets,
        language,
        settings.timezone,
        settings.timezoneId
      );
    })();
  }, [
    dailyPrayers,
    language,
    settings.enabledPrayers,
    settings.globalEnabled,
    settings.latitude,
    settings.longitude,
    settings.notificationSound,
    settings.offsets,
    settings.timezone,
    settings.timezoneId,
    settingsQuery.isLoading,
  ]);

  return useMemo(() => ({
    settings,
    updateSettings,
    togglePrayer,
    setOffset,
    toggleGlobal,
    dismissWelcome,
    setLocation,
    detectAutoLocation,
    setBackgroundLocationEnabled,
    dailyPrayers,
    nextPrayer,
    locationLoading,
    isLoading: settingsQuery.isLoading,
    isAdhanPlaying,
    setIsAdhanPlaying,
    playAthan,
    stopAthan,
    playerStatus,
    recalculatePrayers,
    isPreviewPlaying,
    previewingSoundType,
    previewSound,
    stopPreview,
  }), [
    dailyPrayers,
    detectAutoLocation,
    dismissWelcome,
    isAdhanPlaying,
    isPreviewPlaying,
    locationLoading,
    nextPrayer,
    playAthan,
    playerStatus,
    previewSound,
    previewingSoundType,
    recalculatePrayers,
    setBackgroundLocationEnabled,
    setOffset,
    settings,
    settingsQuery.isLoading,
    stopAthan,
    stopPreview,
    toggleGlobal,
    togglePrayer,
    updateSettings,
  ]);
});
