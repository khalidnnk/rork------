import { useState, useEffect, useCallback, useRef } from 'react';
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
  requestNotificationPermissions,
  scheduleAllNotifications,
} from '@/utils/notifications';


const STORAGE_KEY = 'athan_settings_v3';
const ATHAN_MAX_DURATION = 300;

const athanModule = require('@/assets/audio/athan.mp3');
const ATHAN_WEB_URL = 'https://r2-pub.rork.com/attachments/i1kbtyujmwc57cfnj3z5w';

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
  locationName: 'الرياض',
  latitude: 24.7136,
  longitude: 46.6753,
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
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState<boolean>(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [resolvedSource, setResolvedSource] = useState<{ uri: string } | number | null>(null);
  const sourceResolved = useRef<boolean>(false);

  useEffect(() => {
    async function resolveAudioSource() {
      if (sourceResolved.current) return;
      sourceResolved.current = true;

      if (Platform.OS === 'web') {
        console.log('[AthanContext] Web platform - using remote URL');
        setResolvedSource({ uri: ATHAN_WEB_URL });
        return;
      }

      try {
        console.log('[AthanContext] Resolving local audio asset...');
        const asset = Asset.fromModule(athanModule);
        await asset.downloadAsync();
        console.log('[AthanContext] Asset resolved, localUri:', asset.localUri, 'uri:', asset.uri);
        const uri = asset.localUri || asset.uri;
        if (uri) {
          setResolvedSource({ uri });
          console.log('[AthanContext] Audio source set to:', uri);
        } else {
          console.error('[AthanContext] Could not resolve asset URI, falling back to remote');
          setResolvedSource({ uri: ATHAN_WEB_URL });
        }
      } catch (e) {
        console.error('[AthanContext] Error resolving audio asset:', e, '- falling back to remote URL');
        setResolvedSource({ uri: ATHAN_WEB_URL });
      }
    }

    resolveAudioSource();
  }, []);

  const player = useAudioPlayer(resolvedSource);
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

  const waitForLoaded = useCallback(async (maxWaitMs: number = 8000): Promise<boolean> => {
    if (player.isLoaded) return true;
    console.log('[AthanContext] Waiting for player to load...');
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 300));
      if (player.isLoaded) {
        console.log('[AthanContext] Player loaded after', Date.now() - start, 'ms');
        return true;
      }
    }
    console.warn('[AthanContext] Player did not load within', maxWaitMs, 'ms');
    return false;
  }, [player]);

  const playAthan = useCallback(async () => {
    console.log('[AthanContext] Playing athan, isLoaded:', player.isLoaded, 'duration:', player.duration, 'resolvedSource:', resolvedSource);
    try {
      setIsAdhanPlaying(true);

      player.volume = 1.0;
      player.muted = false;

      if (!resolvedSource) {
        console.log('[AthanContext] Source not resolved yet, waiting...');
        await new Promise(r => setTimeout(r, 2000));
        if (!resolvedSource) {
          console.error('[AthanContext] Audio source still not resolved, aborting');
          setIsAdhanPlaying(false);
          return;
        }
      }

      if (!player.isLoaded) {
        console.log('[AthanContext] Player not loaded, replacing source...');
        if (resolvedSource) {
          player.replace(resolvedSource);
        } else {
          player.replace({ uri: ATHAN_WEB_URL });
        }
        const loaded = await waitForLoaded(10000);
        if (!loaded) {
          console.warn('[AthanContext] Player still not loaded, trying remote URL fallback...');
          player.replace({ uri: ATHAN_WEB_URL });
          const loadedFallback = await waitForLoaded(10000);
          if (!loadedFallback) {
            console.error('[AthanContext] Could not load audio from any source, aborting');
            setIsAdhanPlaying(false);
            return;
          }
        }
      }

      try {
        console.log('[AthanContext] Seeking to 0...');
        await player.seekTo(0);
        console.log('[AthanContext] Seek done');
      } catch (seekErr) {
        console.log('[AthanContext] Seek error (ignoring):', seekErr);
      }

      console.log('[AthanContext] Calling play...');
      player.play();
      console.log('[AthanContext] Play called, playing:', player.playing);

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
  }, [player, waitForLoaded, resolvedSource]);

  const stopAthan = useCallback(() => {
    console.log('[AthanContext] Stopping athan');
    try {
      player.pause();
    } catch (e) {
      console.log('[AthanContext] Error pausing player:', e);
    }
    setIsAdhanPlaying(false);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, [player]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.prayerName) {
        console.log('[AthanContext] Prayer notification received for:', data.prayerName);
        const prayerName = data.prayerName as PrayerName;
        if (settings.globalEnabled && settings.enabledPrayers[prayerName]) {
          console.log('[AthanContext] Auto-playing athan for notification:', prayerName);
          playAthan();
        }
      }
    });

    return () => subscription.remove();
  }, [settings.globalEnabled, settings.enabledPrayers, playAthan]);

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
      if (!hasAutoDetected.current) {
        hasAutoDetected.current = true;
        console.log('[AthanContext] Auto-detecting GPS location on startup');
        detectAutoLocationSilent();
      }
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

      const { status } = await Location.requestForegroundPermissionsAsync();
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

      let locationName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (addresses.length > 0) {
          const addr = addresses[0];
          locationName = [addr.city, addr.country].filter(Boolean).join(', ');
        }
      } catch (e) {
        console.log('[AthanContext] Reverse geocode failed:', e);
      }

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
  }, [updateSettings]);

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

      let locationName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (addresses.length > 0) {
          const addr = addresses[0];
          locationName = [addr.city, addr.country].filter(Boolean).join(', ');
        }
      } catch (e) {
        console.log('[AthanContext] Reverse geocode failed:', e);
      }

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
  }, [updateSettings]);

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
    refreshTimerRef.current = setInterval(() => {
      console.log('[AthanContext] Auto-refresh prayer times');
      recalculatePrayers();
    }, 60000);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [recalculatePrayers]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        console.log('[AthanContext] App became active, refreshing prayer times');
        recalculatePrayers();
      }
    });
    return () => subscription.remove();
  }, [recalculatePrayers]);

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
    setLocation,
    detectAutoLocation,
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
  };
});
