import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Modal,
  useWindowDimensions,
  Alert,
  GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Settings,
  MapPin,
  Bell,
  BellOff,
  Clock,
  Volume2,
  Play,
  Square,
  Compass,
  Navigation,
  Moon,
  Sun,
  Calculator,
  Route,
  Languages,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAthan, NotificationSoundType } from '@/contexts/AthanContext';
import { Volume1 } from 'lucide-react-native';
import { PrayerName } from '@/utils/prayerTimes';
import CityPickerModal from '@/components/CityPickerModal';
import { City } from '@/constants/cities';
import { List } from 'lucide-react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguagePreference, localizedLocationName } from '@/utils/i18n';

const OFFSET_OPTIONS = [0, 2, 5];

function AthanPlayerModal({ visible, onStop, playerStatus }: { visible: boolean; onStop: () => void; playerStatus: { currentTime: number; duration: number; playing: boolean } }) {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const waveAnim3 = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        return;
      }
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();

      const wave1 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
          Animated.timing(waveAnim1, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      const wave2 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 1.5, duration: 2000, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      );
      const wave3 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, { toValue: 1.7, duration: 2500, useNativeDriver: true }),
          Animated.timing(waveAnim3, { toValue: 1, duration: 2500, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      );
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
      );

      wave1.start();
      wave2.start();
      wave3.start();
      glow.start();
      rotate.start();

      return () => {
        wave1.stop();
        wave2.stop();
        wave3.stop();
        glow.stop();
        rotate.stop();
      };
    }
  }, [visible, fadeAnim, scaleAnim, waveAnim1, waveAnim2, waveAnim3, glowAnim, rotateAnim, reduceMotion]);

  const handleStop = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (reduceMotion) {
      onStop();
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onStop();
    });
  }, [onStop, fadeAnim, scaleAnim, reduceMotion]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const safeCurrent = isFinite(playerStatus.currentTime) ? playerStatus.currentTime : 0;
  const safeDuration = isFinite(playerStatus.duration) ? playerStatus.duration : 0;
  const progress = safeDuration > 0 ? safeCurrent / safeDuration : 0;
  const elapsed = Math.floor(safeCurrent);
  const total = Math.floor(safeDuration);
  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent accessibilityViewIsModal>
      <Animated.View style={[athanStyles.overlay, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#0B1A1F', '#091418', '#060E12']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[athanStyles.content, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[athanStyles.waveRing, athanStyles.waveRing3, { transform: [{ scale: waveAnim3 }], opacity: glowAnim }]} />
          <Animated.View style={[athanStyles.waveRing, athanStyles.waveRing2, { transform: [{ scale: waveAnim2 }], opacity: glowAnim }]} />
          <Animated.View style={[athanStyles.waveRing, athanStyles.waveRing1, { transform: [{ scale: waveAnim1 }], opacity: glowAnim }]} />

          <Animated.View style={[athanStyles.iconOuter, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={['rgba(201,168,76,0.15)', 'rgba(201,168,76,0.05)']}
              style={athanStyles.iconOuterGradient}
            />
          </Animated.View>

          <View style={athanStyles.iconCenter}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={athanStyles.athanIcon}
              contentFit="cover"
            />
          </View>

          <Text style={athanStyles.playingLabel}>{t('playingAthan')}</Text>
          <Text style={athanStyles.playingBismillah}>{t('playingTakbir')}</Text>

          <View style={athanStyles.progressContainer}>
            <View style={athanStyles.progressBar}>
              <View style={[athanStyles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={athanStyles.timeRow}>
              <Text style={athanStyles.timeText}>{formatTime(elapsed)}</Text>
              <Text style={athanStyles.timeText}>{formatTime(total)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={athanStyles.stopButton}
            onPress={handleStop}
            activeOpacity={0.8}
            testID="stop-athan-modal"
            accessibilityRole="button"
            accessibilityLabel={t('stopAthan')}
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={athanStyles.stopButtonGradient}
            >
              <Square size={22} color="#fff" fill="#fff" />
              <Text style={athanStyles.stopButtonText}>{t('stopAthan')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { preference, setPreference, language, t } = useLanguage();
  const prayerLabel = useCallback((name: PrayerName) => t(name), [t]);
  const soundOptions: { key: NotificationSoundType; label: string; description: string }[] = [
    { key: 'athan', label: t('haya'), description: t('hayaDescription') },
    { key: 'allahu_akbar', label: t('allahuAkbar'), description: t('allahuAkbarDescription') },
    { key: 'default', label: t('systemSound'), description: t('systemSoundDescription') },
    { key: 'silent', label: t('silent'), description: t('silentDescription') },
  ];
  const {
    settings,
    togglePrayer,
    setOffset,
    toggleGlobal,
    isAdhanPlaying,
    playAthan,
    stopAthan,
    playerStatus,
    detectAutoLocation,
    setBackgroundLocationEnabled,
    locationLoading,
    updateSettings,
    isPreviewPlaying,
    previewingSoundType,
    previewSound,
    stopPreview: _stopPreview,
  } = useAthan();

  const handlePlayAthan = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void playAthan();
  }, [playAthan]);

  const handleStopAthan = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopAthan();
  }, [stopAthan]);

  const handleTogglePrayer = useCallback(
    (name: PrayerName) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      togglePrayer(name);
    },
    [togglePrayer]
  );

  const handleSetOffset = useCallback(
    (name: PrayerName, offset: number) => {
      void Haptics.selectionAsync();
      setOffset(name, offset);
    },
    [setOffset]
  );

  const handleToggleGlobal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleGlobal();
  }, [toggleGlobal]);

  const handleRefreshLocation = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void detectAutoLocation();
  }, [detectAutoLocation]);

  const applyBackgroundLocationToggle = useCallback(async (enabled: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const granted = await setBackgroundLocationEnabled(enabled);
      if (enabled && granted) {
        await detectAutoLocation();
      }
      if (enabled && !granted) {
        Alert.alert(
          t('alwaysLocationTitle'),
          t('alwaysLocationMessage')
        );
      }
    } catch (error) {
      console.error('[Settings] Background location toggle failed:', error);
      Alert.alert(t('autoUpdateFailed'), t('checkLocationPermission'));
    }
  }, [detectAutoLocation, setBackgroundLocationEnabled, t]);

  const handleBackgroundLocationToggle = useCallback((enabled: boolean) => {
    if (!enabled) {
      void applyBackgroundLocationToggle(false);
      return;
    }

    Alert.alert(
      t('backgroundLocationDisclosureTitle'),
      t('backgroundLocationDisclosureMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('continueEnable'),
          onPress: () => void applyBackgroundLocationToggle(true),
        },
      ]
    );
  }, [applyBackgroundLocationToggle, t]);

  const handleSoundChange = useCallback(
    (sound: NotificationSoundType) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateSettings({ notificationSound: sound });
    },
    [updateSettings]
  );

  const handlePreviewSound = useCallback(
    (sound: NotificationSoundType) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void previewSound(sound);
    },
    [previewSound]
  );

  const handlePreviewSoundPress = useCallback((event: GestureResponderEvent, sound: NotificationSoundType) => {
    event.stopPropagation();
    handlePreviewSound(sound);
  }, [handlePreviewSound]);

  const [cityPickerVisible, setCityPickerVisible] = useState<boolean>(false);

  const handleSelectCity = useCallback((city: City) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void setBackgroundLocationEnabled(false);
    updateSettings({
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
      timezoneId: city.timezoneId,
      locationName: city.name,
      locationMode: 'manual',
    });
    setCityPickerVisible(false);
  }, [setBackgroundLocationEnabled, updateSettings]);

  const handleOpenCityPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCityPickerVisible(true);
  }, []);

  const prayerNames: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <View style={styles.container}>
      <Image
        source={isTablet ? require('@/assets/images/bg-tablet.png') : require('@/assets/images/bg-phone.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(15,34,41,0.55)', 'rgba(11,26,31,0.75)', 'rgba(9,20,24,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      <AthanPlayerModal
        visible={isAdhanPlaying}
        onStop={handleStopAthan}
        playerStatus={{
          currentTime: playerStatus.currentTime ?? 0,
          duration: playerStatus.duration ?? 0,
          playing: playerStatus.playing ?? false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Settings size={22} color={Colors.accent} />
          <Text style={styles.headerTitle}>{t('settings')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('language')}</Text>
          <Text style={styles.sectionDescription}>{t('languageDescription')}</Text>
          <View style={styles.card}>
            <View style={styles.languageHeader}>
              <Languages size={18} color={Colors.accent} />
              <Text style={styles.cardRowTitle}>{t('language')}</Text>
            </View>
            <View style={styles.languageOptions}>
              {([
                ['system', t('systemLanguage')],
                ['ar', t('arabic')],
                ['en', t('english')],
              ] as [LanguagePreference, string][]).map(([value, label]) => {
                const selected = preference === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.languageChip, selected && styles.languageChipActive]}
                    onPress={() => void setPreference(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={label}
                  >
                    <Text style={[styles.languageChipText, selected && styles.languageChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('alarm')}</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                {settings.globalEnabled ? (
                  <Bell size={18} color={Colors.accent} />
                ) : (
                  <BellOff size={18} color={Colors.danger} />
                )}
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>{t('globalAthan')}</Text>
                  <Text style={styles.cardRowSubtitle}>
                    {settings.globalEnabled ? t('notificationsEnabled') : t('notificationsDisabled')}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.globalEnabled}
                onValueChange={handleToggleGlobal}
                trackColor={{ false: Colors.surface, true: Colors.accent }}
                thumbColor={Colors.white}
                testID="global-switch"
                accessibilityLabel={t('enableAllAlerts')}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('playAthan')}</Text>
          <View style={styles.card}>
            <View style={styles.athanPlayerWrap}>
              <TouchableOpacity
                style={styles.playStopButton}
                onPress={handlePlayAthan}
                activeOpacity={0.7}
                testID="play-stop-athan"
                accessibilityRole="button"
                accessibilityLabel={t('playFullAthan')}
              >
                <LinearGradient
                  colors={[Colors.accent, '#B8922E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.playStopGradient}
                >
                  <Play size={20} color="#0B1A1F" fill="#0B1A1F" />
                  <Text style={styles.playStopText}>{t('playFullAthan')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('notificationSound')}</Text>
          <Text style={styles.sectionDescription}>
            {t('notificationSoundDescription')}
          </Text>
          <View style={styles.card}>
            {soundOptions.map((option, index) => {
              const isActive = settings.notificationSound === option.key;
              return (
                <View key={option.key}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.soundOptionRow}
                    onPress={() => handleSoundChange(option.key)}
                    activeOpacity={0.7}
                    testID={`sound-${option.key}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isActive }}
                    accessibilityLabel={`${option.label}، ${option.description}`}
                  >
                    <View style={styles.soundOptionLeft}>
                      <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                        {isActive && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.cardRowTextWrap}>
                        <Text style={[styles.cardRowTitle, isActive && styles.soundOptionActive]}>{option.label}</Text>
                        <Text style={styles.cardRowSubtitle}>{option.description}</Text>
                      </View>
                    </View>
                    <View style={styles.soundOptionRight}>
                      {option.key !== 'silent' && (
                        <TouchableOpacity
                          style={[
                            styles.previewButton,
                            isPreviewPlaying && previewingSoundType === option.key && styles.previewButtonActive,
                          ]}
                          onPress={(event) => handlePreviewSoundPress(event, option.key)}
                          activeOpacity={0.6}
                          testID={`preview-${option.key}`}
                          accessibilityRole="button"
                          accessibilityLabel={t('previewSound', { sound: option.label })}
                        >
                          {isPreviewPlaying && previewingSoundType === option.key ? (
                            <Square size={13} color={Colors.accent} fill={Colors.accent} />
                          ) : (
                            <Volume1 size={16} color={isActive ? Colors.accent : Colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      )}
                      {isActive && (
                        <View style={styles.activeLabel}>
                          <Text style={styles.activeLabelText}>{t('enabled')}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('enablePrayers')}</Text>
          <View style={styles.card}>
            {prayerNames.map((name, index) => (
              <View key={name}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.prayerToggleRow}>
                  <View style={styles.prayerToggleLeft}>
                    <Volume2
                      size={16}
                      color={
                        settings.enabledPrayers[name] && settings.globalEnabled
                          ? Colors.accent
                          : Colors.textMuted
                      }
                    />
                    <Text style={styles.prayerToggleName}>{prayerLabel(name)}</Text>
                  </View>
                  <Switch
                    value={settings.enabledPrayers[name]}
                    onValueChange={() => handleTogglePrayer(name)}
                    trackColor={{ false: Colors.surface, true: Colors.accent }}
                    thumbColor={Colors.white}
                    testID={`toggle-${name}`}
                    accessibilityLabel={t('enablePrayerAlert', { prayer: prayerLabel(name) })}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('delayAthan')}</Text>
          <Text style={styles.sectionDescription}>
            {t('delayDescription')}
          </Text>
          <View style={styles.card}>
            {prayerNames.map((name, index) => (
              <View key={name}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.offsetRow}>
                  <Text style={styles.offsetPrayerName}>{prayerLabel(name)}</Text>
                  <View style={styles.offsetOptions}>
                    {OFFSET_OPTIONS.map((opt) => {
                      const isActive = settings.offsets[name] === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.offsetChip,
                            isActive && styles.offsetChipActive,
                          ]}
                          onPress={() => handleSetOffset(name, opt)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          accessibilityLabel={`${prayerLabel(name)}, ${opt === 0 ? t('noDelay') : t('delayMinutes', { minutes: opt })}`}
                        >
                          <Text
                            style={[
                              styles.offsetChipText,
                              isActive && styles.offsetChipTextActive,
                            ]}
                          >
                            {opt === 0 ? t('onTime') : `+${opt}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('location')}</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <MapPin size={18} color={Colors.accent} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>{t('currentLocation')}</Text>
                  <Text style={styles.cardRowSubtitle}>
                    {locationLoading ? t('locating') : localizedLocationName(settings.locationName, settings.latitude, settings.longitude, language)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Route size={18} color={settings.backgroundLocationEnabled ? Colors.accent : Colors.textSecondary} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>{t('travelUpdates')}</Text>
                  <Text style={styles.cardRowSubtitle}>
                    {t('travelUpdatesDescription')}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.backgroundLocationEnabled}
                onValueChange={(enabled) => void handleBackgroundLocationToggle(enabled)}
                trackColor={{ false: Colors.surface, true: Colors.accent }}
                thumbColor={Colors.white}
                testID="background-location-switch"
                accessibilityLabel={t('travelUpdatesLabel')}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Compass size={18} color={Colors.textSecondary} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>{t('coordinates')}</Text>
                  <Text style={styles.cardRowSubtitle}>
                    {settings.latitude.toFixed(4)}°N, {settings.longitude.toFixed(4)}°E
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Clock size={18} color={Colors.textSecondary} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>{t('timezone')}</Text>
                  <Text style={styles.cardRowSubtitle}>
                    UTC{settings.timezone >= 0 ? '+' : ''}{settings.timezone}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.locationActionsRow}>
              <TouchableOpacity
                style={styles.locationActionButton}
                onPress={handleRefreshLocation}
                activeOpacity={0.7}
                testID="refresh-location"
                accessibilityRole="button"
                accessibilityLabel={t('refreshGpsLabel')}
              >
                <Navigation size={15} color={Colors.teal} />
                <Text style={styles.locationActionTextTeal}>
                  {locationLoading ? t('updating') : t('autoGps')}
                </Text>
              </TouchableOpacity>

              <View style={styles.locationActionDivider} />

              <TouchableOpacity
                style={styles.locationActionButton}
                onPress={handleOpenCityPicker}
                activeOpacity={0.7}
                testID="open-city-picker"
                accessibilityRole="button"
                accessibilityLabel={t('manualCityLabel')}
              >
                <List size={15} color={Colors.accent} />
                <Text style={styles.locationActionTextAccent}>{t('manualCity')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <CityPickerModal
          visible={cityPickerVisible}
          onClose={() => setCityPickerVisible(false)}
          onSelectCity={handleSelectCity}
          currentCityName={settings.locationName}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('calculationMethod')}</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Calculator size={18} color={Colors.accent} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>{t('ummAlQuraMakkah')}</Text>
                  <Text style={styles.cardRowSubtitle}>{t('offlineCalculation')}</Text>
                </View>
              </View>
              <View style={styles.lockedLabel}>
                <Text style={styles.lockedLabelText}>{t('fixed')}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.calcDetailRow}>
              <View style={styles.calcDetailItem}>
                <Sun size={14} color={Colors.textSecondary} />
                <Text style={styles.calcDetailLabel}>{t('fajr')}</Text>
                <Text style={styles.calcDetailValue}>18.5°</Text>
              </View>
              <View style={styles.calcDetailSeparator} />
              <View style={styles.calcDetailItem}>
                <Moon size={14} color={Colors.textSecondary} />
                <Text style={styles.calcDetailLabel}>{t('isha')}</Text>
                <Text style={styles.calcDetailValue}>{t('ishaAfterMaghrib')}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.calcRamadanRow}>
              <View style={styles.ramadanBadge}>
                <Moon size={12} color={Colors.accent} />
                <Text style={styles.ramadanBadgeText}>{t('ramadan')}</Text>
              </View>
              <View style={styles.calcDetailTextWrap}>
                <Text style={styles.calcRamadanTitle}>{t('ramadanIsha')}</Text>
                <Text style={styles.calcRamadanSubtitle}>
                  {t('ramadanIshaDetail')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.dedicationCard}>
          <Text style={styles.dedicationText}>
            {t('dedication')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as const,
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Dubai-Bold',
    color: Colors.textMutedReadable,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  languageHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    paddingTop: 8,
  },
  languageChip: {
    flex: 1,
    minWidth: 90,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  languageChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  languageChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    textAlign: 'center',
  },
  languageChipTextActive: {
    color: Colors.accentLight,
    fontFamily: 'Dubai-Bold',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardRowTextWrap: {
    flex: 1,
  },
  cardRowTitle: {
    fontSize: 15,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
  },
  cardRowSubtitle: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.separator,
    marginHorizontal: 16,
  },
  athanPlayerWrap: {
    padding: 16,
  },
  playStopButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  playStopButtonActive: {},
  playStopGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  playStopText: {
    fontSize: 16,
    fontFamily: 'Dubai-Bold',
    color: '#0B1A1F',
  },
  playStopTextActive: {
    color: '#FFF',
  },
  progressWrap: {
    marginTop: 14,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressTime: {
    fontSize: 12,
    fontFamily: 'Dubai-Medium',
    color: Colors.textMutedReadable,
    fontVariant: ['tabular-nums'] as const,
  },
  prayerToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  prayerToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerToggleName: {
    fontSize: 15,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
  },
  offsetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  offsetPrayerName: {
    fontSize: 15,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
  },
  offsetOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  offsetChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  offsetChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  offsetChipText: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: Colors.textSecondary,
  },
  offsetChipTextActive: {
    color: Colors.accent,
  },
  activeLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.accentDim,
  },
  activeLabelText: {
    fontSize: 11,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
  },
  lockedLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  calcDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 0,
  },
  calcDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calcDetailSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.separator,
  },
  calcDetailLabel: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: Colors.textSecondary,
  },
  calcDetailValue: {
    fontSize: 13,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
  },
  calcRamadanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  ramadanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ramadanBadgeText: {
    fontSize: 11,
    fontFamily: 'Dubai-Bold',
    color: Colors.accent,
  },
  calcDetailTextWrap: {
    flex: 1,
  },
  calcRamadanTitle: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
  },
  calcRamadanSubtitle: {
    fontSize: 12,
    fontFamily: 'Dubai-Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  lockedLabelText: {
    fontSize: 11,
    fontFamily: 'Dubai-Medium',
    color: Colors.textMutedReadable,
  },
  dedicationCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  dedicationText: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  locationActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
  },
  locationActionDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.separator,
  },
  locationActionTextTeal: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: Colors.teal,
  },
  locationActionTextAccent: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
  },
  soundOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  soundOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  soundOptionActive: {
    color: Colors.accent,
  },
  soundOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  previewButtonActive: {
    backgroundColor: Colors.accentDim,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
});

const athanStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  waveRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  waveRing1: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  waveRing2: {
    width: 260,
    height: 260,
    backgroundColor: 'rgba(201,168,76,0.02)',
  },
  waveRing3: {
    width: 340,
    height: 340,
    backgroundColor: 'rgba(201,168,76,0.01)',
  },
  iconOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  iconOuterGradient: {
    flex: 1,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.25)',
    borderStyle: 'dashed',
  },
  iconCenter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.accent,
    marginBottom: 36,
  },
  athanIcon: {
    width: '100%',
    height: '100%',
  },
  playingLabel: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
    letterSpacing: 1,
    marginBottom: 8,
  },
  playingBismillah: {
    fontSize: 28,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Dubai-Medium',
    color: Colors.textMutedReadable,
    fontVariant: ['tabular-nums'] as const,
  },
  stopButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '80%',
  },
  stopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  stopButtonText: {
    fontSize: 18,
    fontFamily: 'Dubai-Bold',
    color: '#fff',
  },
});
