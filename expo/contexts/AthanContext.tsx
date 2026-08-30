import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Asset } from 'expo-asset';
import {
  PrayerName,
  PrayerTime,
  DailyPrayers,
  calculatePrayerTimes,
  getNextPrayerWithTomorrow,
  getTimezoneOffset,
  getDateKey,
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


const STORAGE_KEY = ATHAN_SETTINGS_STORAGE_KEY;
const ATHAN_MAX_DURATION = 300;

const fullAthanModule = require('@/assets/audio/athan.m4a');
const hayaModule = require('@/assets/audio/haya_ala_salah.m4a');
const allahuAkbarModule = require('@/assets/audio/allahu_akbar.m4a');
const NOTIFICATION_ATHAN_RESUME_POSITION = 30;

export type NotificationSoundType = 'athan' | 'full_athan' | 'allahu_akbar' | 'default' | 'silent';

export interface AthanSettings {
  globalEnabled: boolean;
  enabledPrayers: Record<PrayerName, boolean>;
  offsets: Record<PrayerName, number>;
  locationName: string;
  latitude: number;
  longitude: number;
  timezone: number;
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
  locationMode: 'auto' as const,
  backgroundLocationEnabled: false,
  hasSeenWelcome: false,
  notificationSound: 'athan' as const,
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
  const { language, t } = useLanguage();
  const [settings, setSettings] = useState<AthanSettings>(DEFAULT_SETTINGS);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState<boolean>(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewingSoundType, setPreviewingSoundType] = useState<NotificationSoundType | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [resolvedFullAthan, setResolvedFullAthan] = useState<{ uri: string } | null>(null);
  const [resolvedHaya, setResolvedHaya] = useState<{ uri: string } | null>(null);
  const [resolvedAllahuAkbar, setResolvedAllahuAkbar] = useState<{ uri: string } | null>(null);
  const sourceResolved = useRef<boolean>(false);
  const _notificationResumeRef = useRef<boolean>(false);

  const getSourceForType = useCallback((type: NotificationSoundType): { uri: string } | null => {
    if (type === 'full_athan') return resolvedFullAthan;
    if (type === 'athan') return resolvedHaya;
    if (type === 'allahu_akbar') return resolvedAllahuAkbar;
    return null;
  }, [resolvedFullAthan, resolvedHaya, resolvedAllahuAkbar]);

  const getBundledSourceForType = useCallback((type: NotificationSoundType): { uri: string } => {
    const module = type === 'full_athan'
      ? fullAthanModule
      : type === 'allahu_akbar'
        ? allahuAkbarModule
        : hayaModule;
    return { uri: Asset.fromModule(module).uri };
  }, []);

  useEffect(() => {
    async function resolveAudioSources() {
      if (sourceResolved.current) return;
      sourceResolved.current = true;

      try {
        console.log('[AthanContext] Resolving local audio assets...');
        const fullAsset = Asset.fromModule(fullAthanModule);
        const hayaAsset = Asset.fromModule(hayaModule);
        const akbarAsset = Asset.fromModule(allahuAkbarModule);
        await Promise.all([fullAsset.downloadAsync(), hayaAsset.downloadAsync(), akbarAsset.downloadAsync()]);

        const fullUri = fullAsset.localUri || fullAsset.uri;
        const hayaUri = hayaAsset.localUri || hayaAsset.uri;
        const akbarUri = akbarAsset.localUri || akbarAsset.uri;

        if (fullUri) {
          setResolvedFullAthan({ uri: fullUri });
          console.log('[AthanContext] Full athan source set to:', fullUri);
        } else {
          setResolvedFullAthan(getBundledSourceForType('full_athan'));
        }

        if (hayaUri) {
          setResolvedHaya({ uri: hayaUri });
          console.log('[AthanContext] Haya source set to:', hayaUri);
        } else {
          setResolvedHaya(getBundledSourceForType('athan'));
        }

        if (akbarUri) {
          setResolvedAllahuAkbar({ uri: akbarUri });
          console.log('[AthanContext] Allahu Akbar source set to:', akbarUri);
        } else {
          setResolvedAllahuAkbar(getBundledSourceForType('allahu_akbar'));
        }
      } catch (e) {
        console.error('[AthanContext] Error resolving audio assets:', e);
        setResolvedFullAthan(getBundledSourceForType('full_athan'));
        setResolvedHaya(getBundledSourceForType('athan'));
        setResolvedAllahuAkbar(getBundledSourceForType('allahu_akbar'));
      }
    }

    void resolveAudioSources();
  }, [getBundledSourceForType]);

  const currentSource = settings.notificationSound === 'full_athan'
    ? resolvedFullAthan
    : settings.notificationSound === 'allahu_akbar'
      ? resolvedAllahuAkbar
      : resolvedHaya;
  const player = useAudioPlayer(currentSource);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    console.log('[AthanContext] Setting audio mode...');
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).then(() => {
      console.log('[AthanContext] Audio mode set successfully');
    }).catch((e) => console.log('[AthanContext] setAudioModeAsync error:', e));
  }, []);

  useEffect(() => {
    console.log('[AthanContext] PlayerStatus update - playing:', playerStatus.playing, 'isLoaded:', playerStatus.isLoaded, 'duration:', playerStatus.duration, 'playbackState:', playerStatus.playbackState);
  }, [playerStatus.playing, playerStatus.isLoaded, playerStatus.playbackState, playerStatus.duration]);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status?.error) {
        console.error('[AthanContext] Player error event:', status.error);
      }
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      console.log('[AthanContext] Athan playback finished');
      setIsAdhanPlaying(false);
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    }
  }, [playerStatus.didJustFinish]);

  const waitForLoaded = useCallback(async (maxWaitMs: number = 5000): Promise<boolean> => {
    if (player.isLoaded) return true;
    console.log('[AthanContext] Waiting for player to load...');
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 100));
      if (player.isLoaded) {
        console.log('[AthanContext] Player loaded after', Date.now() - start, 'ms');
        return true;
      }
    }
    console.warn('[AthanContext] Player did not load within', maxWaitMs, 'ms');
    return false;
  }, [player]);

  const playAthanWithType = useCallback(async (soundType: NotificationSoundType = 'full_athan', resumeFromNotification: boolean = false) => {
    console.log('[AthanContext] Playing athan type:', soundType, 'isLoaded:', player.isLoaded, 'resume:', resumeFromNotification);
    try {
      setIsAdhanPlaying(true);
      player.volume = 1.0;
      player.muted = false;

      const actualType = (resumeFromNotification && soundType === 'full_athan') ? 'full_athan' : soundType;
      const source = getSourceForType(actualType) || getBundledSourceForType(actualType);

      player.replace(source);
      const loaded = await waitForLoaded(5000);
      if (loaded) {
        if (resumeFromNotification && soundType === 'full_athan') {
          try {
            await player.seekTo(NOTIFICATION_ATHAN_RESUME_POSITION);
            console.log('[AthanContext] Seeking to', NOTIFICATION_ATHAN_RESUME_POSITION, 's to continue after notification');
          } catch (seekErr) {
            console.log('[AthanContext] Seek error, playing from start:', seekErr);
          }
        } else {
          try { await player.seekTo(0); } catch { /* seek error */ }
        }
        player.play();
        console.log('[AthanContext] Player loaded and playing type:', soundType);
      } else {
        console.log('[AthanContext] Trying fallback URL for type:', soundType);
        player.replace(getBundledSourceForType(actualType));
        const fallbackLoaded = await waitForLoaded(5000);
        if (fallbackLoaded) {
          if (resumeFromNotification && soundType === 'full_athan') {
            try { await player.seekTo(NOTIFICATION_ATHAN_RESUME_POSITION); } catch { /* seek error */ }
          } else {
            try { await player.seekTo(0); } catch { /* seek error */ }
          }
          player.play();
        } else {
          console.error('[AthanContext] Could not load audio, aborting');
          setIsAdhanPlaying(false);
          return;
        }
      }

      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
      stopTimerRef.current = setTimeout(() => {
        console.log('[AthanContext] Auto-stopping athan after', ATHAN_MAX_DURATION, 'seconds');
        player.pause();
        setIsAdhanPlaying(false);
        stopTimerRef.current = null;
      }, ATHAN_MAX_DURATION * 1000);
    } catch (e) {
      console.error('[AthanContext] Error playing athan:', e);
      setIsAdhanPlaying(false);
    }
  }, [player, waitForLoaded, getSourceForType, getBundledSourceForType]);

  const playAthan = useCallback(async () => {
    await playAthanWithType('full_athan');
  }, [playAthanWithType]);

  const stopAthan = useCallback(() => {
    console.log('[AthanContext] Stopping athan');
    try {
      player.pause();
    } catch (e) {
      console.log('[AthanContext] Error pausing player:', e);
    }
    setIsAdhanPlaying(false);
    setIsPreviewPlaying(false);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, [player]);

  const previewSound = useCallback(async (soundType: NotificationSoundType) => {
    console.log('[AthanContext] Preview sound:', soundType);
    if (soundType === 'silent') return;

    if (isPreviewPlaying || isAdhanPlaying) {
      try { player.pause(); } catch { /* pause error */ }
      setIsPreviewPlaying(false);
      setPreviewingSoundType(null);
      setIsAdhanPlaying(false);
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      return;
    }

    try {
      setIsPreviewPlaying(true);
      setPreviewingSoundType(soundType);
      player.volume = 1.0;
      player.muted = false;

      if (soundType === 'athan' || soundType === 'full_athan' || soundType === 'allahu_akbar') {
        const source = getSourceForType(soundType) || getBundledSourceForType(soundType);
        console.log('[AthanContext] Preview: replacing with source for type:', soundType);
        player.replace(source);
        let loaded = await waitForLoaded(5000);
        if (!loaded) {
          console.log('[AthanContext] Preview: trying fallback URL...');
          player.replace(getBundledSourceForType(soundType));
          loaded = await waitForLoaded(5000);
        }
        if (loaded) {
          try { await player.seekTo(0); } catch { /* seek error */ }
          player.play();
          console.log('[AthanContext] Preview: playing successfully type:', soundType);
        } else {
          console.error('[AthanContext] Preview: could not load audio after retries');
          setIsPreviewPlaying(false);
          setPreviewingSoundType(null);
          return;
        }

        const previewDuration = soundType === 'full_athan' ? 10000 : soundType === 'allahu_akbar' ? 30000 : 8000;
        previewTimerRef.current = setTimeout(() => {
          console.log('[AthanContext] Preview auto-stop');
          try { player.pause(); } catch { /* pause error */ }
          setIsPreviewPlaying(false);
          setPreviewingSoundType(null);
          previewTimerRef.current = null;
        }, previewDuration);
      } else if (soundType === 'default') {
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
        setTimeout(() => {
          setIsPreviewPlaying(false);
          setPreviewingSoundType(null);
        }, 1500);
      }
    } catch (e) {
      console.error('[AthanContext] Preview error:', e);
      setIsPreviewPlaying(false);
      setPreviewingSoundType(null);
    }
  }, [player, isPreviewPlaying, isAdhanPlaying, getSourceForType, getBundledSourceForType, waitForLoaded, t]);

  const stopPreview = useCallback(() => {
    console.log('[AthanContext] Stopping preview');
    try { player.pause(); } catch { /* pause error */ }
    setIsPreviewPlaying(false);
    setPreviewingSoundType(null);
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, [player]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.prayerName) {
        console.log('[AthanContext] Prayer notification received (foreground) for:', data.prayerName);
        const prayerName = data.prayerName as PrayerName;
        if (settings.globalEnabled && settings.enabledPrayers[prayerName]) {
          const soundType = settings.notificationSound;
          console.log('[AthanContext] Auto-playing athan for notification:', prayerName, 'soundType:', soundType);
          if (soundType === 'athan' || soundType === 'full_athan' || soundType === 'allahu_akbar') {
            void playAthanWithType(soundType, false);
          }
        }
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const actionId = response.actionIdentifier;
      console.log('[AthanContext] Notification response, actionId:', actionId, 'data:', JSON.stringify(data));
      if (data?.prayerName) {
        const prayerName = data.prayerName as PrayerName;
        const soundType = (data.soundType as NotificationSoundType) || settings.notificationSound;
        console.log('[AthanContext] Notification tapped/action for:', prayerName, 'soundType:', soundType, 'action:', actionId);
        if (actionId === 'OPEN_ATHAN' || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          if (soundType === 'athan' || soundType === 'full_athan' || soundType === 'allahu_akbar') {
            const shouldResume = soundType === 'full_athan';
            void playAthanWithType(soundType, shouldResume);
          }
        }
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [settings.globalEnabled, settings.enabledPrayers, settings.notificationSound, playAthanWithType]);

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

  const hasAutoDetected = useRef<boolean>(false);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = useCallback(
    (partial: Partial<AthanSettings>) => {
      setSettings(prev => {
        const updated = { ...prev, ...partial };
        saveMutation.mutate(updated);
        return updated;
      });
    },
    [saveMutation]
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

  const setLocation = useCallback(
    (latitude: number, longitude: number, locationName: string, timezone: number) => {
      console.log('[AthanContext] Setting location:', locationName, latitude, longitude);
      updateSettings({
        latitude,
        longitude,
        locationName,
        timezone,
        locationMode: 'manual',
      });
      setLocationLoading(false);
    },
    [updateSettings]
  );

  const detectAutoLocationSilent = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const tz = getTimezoneOffset();
              let locationName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
              updateSettings({
                latitude: lat,
                longitude: lng,
                timezone: tz,
                locationName,
                locationMode: 'auto',
              });
            },
            () => {
              console.log('[AthanContext] Web geolocation denied silently');
            }
          );
        }
        return;
      }

      // Never show a permission prompt silently. Onboarding/settings own the
      // prompt; automatic refresh only uses a permission already granted.
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[AthanContext] Location permission denied on startup');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const tz = getTimezoneOffset();

      const locationName = await resolveLocationName(lat, lng, language);

      updateSettings({
        latitude: lat,
        longitude: lng,
        timezone: tz,
        locationName,
        locationMode: 'auto',
      });
    } catch (e) {
      console.error('[AthanContext] Silent location error:', e);
    }
  }, [updateSettings, language]);

  // Automatic is the default mode. It remains active across launches until
  // the user explicitly chooses a city, which switches locationMode to manual.
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
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const tz = getTimezoneOffset();
              updateSettings({
                latitude: lat,
                longitude: lng,
                timezone: tz,
                locationName: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
                locationMode: 'auto',
              });
              setLocationLoading(false);
            },
            () => {
              console.log('[AthanContext] Web geolocation denied, using defaults');
              setLocationLoading(false);
            }
          );
        } else {
          setLocationLoading(false);
        }
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[AthanContext] Location permission denied');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const tz = getTimezoneOffset();

      const locationName = await resolveLocationName(lat, lng, language);

      updateSettings({
        latitude: lat,
        longitude: lng,
        timezone: tz,
        locationName,
        locationMode: 'auto',
      });
      setLocationLoading(false);
    } catch (e) {
      console.error('[AthanContext] Location error:', e);
      setLocationLoading(false);
    }
  }, [updateSettings, language]);

  const setBackgroundLocationEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    if (!enabled) {
      await stopBackgroundLocationUpdates();
      updateSettings({ backgroundLocationEnabled: false });
      return true;
    }

    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      updateSettings({ backgroundLocationEnabled: false });
      return false;
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') {
      updateSettings({ backgroundLocationEnabled: false });
      return false;
    }

    await startBackgroundLocationUpdates();
    updateSettings({ backgroundLocationEnabled: true, locationMode: 'auto' });
    return true;
  }, [updateSettings]);

  useEffect(() => {
    if (Platform.OS === 'web' || settingsQuery.isLoading) return;
    if (!settings.backgroundLocationEnabled) return;

    void Location.getBackgroundPermissionsAsync().then((permission) => {
      if (permission.status === 'granted') {
        return startBackgroundLocationUpdates();
      }
      updateSettings({ backgroundLocationEnabled: false });
    }).catch((error) => {
      console.error('[AthanContext] Background location restore failed:', error);
    });
  }, [settings.backgroundLocationEnabled, settingsQuery.isLoading, updateSettings]);

  const [dateKey, setDateKey] = useState<string>(getDateKey());
  const [dailyPrayers, setDailyPrayers] = useState<DailyPrayers>(() => {
    console.log('[AthanContext] Initial prayer times calculation');
    const systemTz = getTimezoneOffset();
    return calculatePrayerTimes(
      new Date(),
      DEFAULT_SETTINGS.latitude,
      DEFAULT_SETTINGS.longitude,
      systemTz,
      DEFAULT_SETTINGS.offsets
    );
  });
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);

  const recalculatePrayers = useCallback(() => {
    const systemTz = getTimezoneOffset();
    const now = new Date();
    console.log('[AthanContext] Recalculating prayer times | lat:', settings.latitude, 'lng:', settings.longitude, 'tz:', systemTz);
    const prayers = calculatePrayerTimes(
      now,
      settings.latitude,
      settings.longitude,
      systemTz,
      settings.offsets
    );
    console.log('[AthanContext] Prayer times:', prayers.prayers.map(p => `${p.name}: ${p.timeStr}`).join(', '));
    setDailyPrayers(prayers);
    return prayers;
  }, [settings.latitude, settings.longitude, settings.offsets]);

  useEffect(() => {
    recalculatePrayers();
  }, [recalculatePrayers, dateKey]);

  useEffect(() => {
    publishWidgetData(settings, language);
  }, [settings, language]);

  useEffect(() => {
    const updateNextPrayer = () => {
      const now = new Date();
      const systemTz = getTimezoneOffset();
      const result = getNextPrayerWithTomorrow(
        dailyPrayers.prayers,
        settings.latitude,
        settings.longitude,
        systemTz,
        settings.offsets
      );
      if (result) {
        setNextPrayer((prev) => {
          if (!prev || prev.name !== result.prayer.name || prev.time.getTime() !== result.prayer.time.getTime()) {
            console.log(`[AthanContext] Next prayer: ${result.prayer.name} at ${result.prayer.timeStr} (tomorrow: ${result.isTomorrow}) | now: ${now.toLocaleTimeString()}`);
            return result.prayer;
          }
          return prev;
        });
      } else {
        setNextPrayer(null);
      }

      const newDateKey = getDateKey();
      if (newDateKey !== dateKey) {
        console.log('[AthanContext] Date changed, recalculating');
        setDateKey(newDateKey);
      }
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 3000);
    return () => clearInterval(interval);
  }, [dailyPrayers, settings.latitude, settings.longitude, settings.timezone, settings.offsets, dateKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        console.log('[AthanContext] App became active, refreshing prayer times');
        void loadSettings().then((storedSettings) => {
          setSettings(storedSettings);
          setDailyPrayers(calculatePrayerTimes(
            new Date(),
            storedSettings.latitude,
            storedSettings.longitude,
            getTimezoneOffset(),
            storedSettings.offsets
          ));
          if (storedSettings.locationMode === 'auto') {
            void detectAutoLocationSilent();
          }
        });
      }
    });
    return () => subscription.remove();
  }, [detectAutoLocationSilent]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (!settings.globalEnabled) {
      void cancelAllNotifications();
      return;
    }

    async function scheduleNotifs() {
      const granted = await requestNotificationPermissions(language);
      if (granted) {
        await scheduleAllNotifications(dailyPrayers.prayers, settings.enabledPrayers, settings.notificationSound, settings.latitude, settings.longitude, settings.offsets, language);
      }
    }

    void scheduleNotifs();
  }, [dailyPrayers, settings.enabledPrayers, settings.globalEnabled, settings.notificationSound, settings.latitude, settings.longitude, settings.offsets, language]);

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
    playAthanWithType,
    stopAthan,
    playerStatus,
    recalculatePrayers,
    isPreviewPlaying,
    previewingSoundType,
    previewSound,
    stopPreview,
  }), [
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
    settingsQuery.isLoading,
    isAdhanPlaying,
    setIsAdhanPlaying,
    playAthan,
    playAthanWithType,
    stopAthan,
    playerStatus,
    recalculatePrayers,
    isPreviewPlaying,
    previewingSoundType,
    previewSound,
    stopPreview,
  ]);
});
