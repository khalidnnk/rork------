import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  MapPin,
  Clock,
  Sun,
  Sunset,
  Sunrise,
  Moon,
  CloudSun,
  Volume2,
  VolumeX,
  Heart,
  Info,
} from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAthan } from '@/contexts/AthanContext';
import { getTimeUntil, PrayerName } from '@/utils/prayerTimes';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizedLocationName } from '@/utils/i18n';

const PRAYER_ICONS: Record<PrayerName, React.ComponentType<{ size: number; color: string }>> = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
};

function AboutModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const aboutFadeAnim = useRef(new Animated.Value(0)).current;
  const aboutScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        aboutFadeAnim.setValue(1);
        aboutScaleAnim.setValue(1);
        return;
      }
      aboutFadeAnim.setValue(0);
      aboutScaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(aboutFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(aboutScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, reduceMotion, aboutFadeAnim, aboutScaleAnim]);

  const handleDismiss = useCallback(() => {
    if (reduceMotion) {
      onDismiss();
      return;
    }
    Animated.parallel([
      Animated.timing(aboutFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(aboutScaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, aboutFadeAnim, aboutScaleAnim, reduceMotion]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent accessibilityViewIsModal>
      <Animated.View style={[styles.welcomeOverlay, { opacity: aboutFadeAnim }]}>
        <Animated.View style={[styles.welcomeCard, { transform: [{ scale: aboutScaleAnim }] }]}>
          <LinearGradient
            colors={['#132D38', '#0F2229', '#0B1A1F']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeIconWrap}>
              <Heart size={32} color={Colors.accent} fill={Colors.accent} />
            </View>

            <Text style={styles.welcomeTitle}>{t('about')}</Text>

            <Text style={styles.aboutMessage}>
              {t('aboutCreated')}
            </Text>

            <View style={styles.welcomeDivider} />

            <Text style={styles.aboutDua}>
              {t('aboutDua')}
            </Text>

            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.welcomeAppIcon}
              contentFit="cover"
              accessibilityLabel={t('imageLabel')}
            />

            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
            >
              <LinearGradient
                colors={[Colors.accent, '#B8922E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.welcomeButtonGradient}
              >
                <Text style={styles.welcomeButtonText}>{t('close')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function WelcomeModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, reduceMotion, fadeAnim, scaleAnim]);

  const handleDismiss = useCallback(() => {
    if (reduceMotion) {
      onDismiss();
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, fadeAnim, scaleAnim, reduceMotion]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent accessibilityViewIsModal>
      <Animated.View style={[styles.welcomeOverlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.welcomeCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#132D38', '#0F2229', '#0B1A1F']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeIconWrap}>
              <Heart size={32} color={Colors.accent} fill={Colors.accent} />
            </View>

            <Text style={styles.welcomeTitle}>{t('appName')}</Text>

            <Text style={styles.aboutMessage}>{t('welcomeSubtitle')}</Text>

            <View style={styles.welcomeDivider} />

            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.welcomeAppIcon}
              contentFit="cover"
              accessibilityLabel={t('imageLabel')}
            />

            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('start')}
            >
              <LinearGradient
                colors={[Colors.accent, '#B8922E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.welcomeButtonGradient}
              >
                <Text style={styles.welcomeButtonText}>{t('start')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const reduceMotion = useReducedMotion();
  const { language, t } = useLanguage();
  const {
    settings,
    dailyPrayers,
    nextPrayer,
    locationLoading,

    dismissWelcome,
  } = useAthan();

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    dailyPrayers.prayers.map(() => new Animated.Value(40))
  ).current;
  const opacityAnims = useRef(
    dailyPrayers.prayers.map(() => new Animated.Value(0))
  ).current;
  const countdownScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      countdownScale.setValue(1);
      slideAnims.forEach((anim) => anim.setValue(0));
      opacityAnims.forEach((anim) => anim.setValue(1));
      return;
    }
    if (!settings.hasSeenWelcome) {
      const timer = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(timer);
    }
  }, [settings.hasSeenWelcome]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(countdownScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    dailyPrayers.prayers.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 450,
          delay: 200 + i * 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnims[i], {
          toValue: 1,
          duration: 450,
          delay: 200 + i * 90,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [reduceMotion, fadeAnim, countdownScale, slideAnims, opacityAnims, dailyPrayers.prayers]);

  useEffect(() => {
    const updateCountdown = () => {
      if (nextPrayer) {
        setCountdown(getTimeUntil(nextPrayer.time));
      } else {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    dismissWelcome();
  }, [dismissWelcome]);

  const now = new Date();
  const dateStr = now.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const padNum = (n: number) => n.toString().padStart(2, '0');

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

      <WelcomeModal visible={showWelcome} onDismiss={handleDismissWelcome} />
      <AboutModal visible={showAbout} onDismiss={() => setShowAbout(false)} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View style={styles.appTitleRow}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.appIcon}
                contentFit="cover"
              />
              <View style={styles.appTitle}>
                <Text style={styles.titleTextAr}>{t('appName')}</Text>
                {language === 'ar' && <Text style={styles.subtitleText}>{t('appNameEn')}</Text>}
              </View>
            </View>
            <TouchableOpacity
                style={styles.aboutButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAbout(true);
                }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('about')}
                testID="about-button"
              >
                <Info size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.locationText}>
              {locationLoading ? t('locating') : localizedLocationName(settings.locationName, settings.latitude, settings.longitude, language)}
            </Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
        </Animated.View>

        {nextPrayer && (
          <Animated.View style={[styles.countdownCard, { opacity: fadeAnim, transform: [{ scale: countdownScale }] }]}>
            <LinearGradient
              colors={['rgba(201,168,76,0.1)', 'rgba(201,168,76,0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.countdownGradient}
            >
              <View style={styles.countdownHeader}>
                <Clock size={13} color={Colors.accent} />
                <Text style={styles.countdownLabel}>{t('nextPrayer')}</Text>
              </View>

              <Text style={styles.countdownPrayerAr}>{language === 'ar' ? nextPrayer.labelAr : nextPrayer.label}</Text>
              {language === 'ar' && <Text style={styles.countdownPrayerEn}>{nextPrayer.label}</Text>}

              <View style={styles.countdownTimerRow}>
                <View style={styles.timerSegment}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNumber}>{padNum(countdown.hours)}</Text>
                  </View>
                  <Text style={styles.timerUnit}>{t('hour')}</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerSegment}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNumber}>{padNum(countdown.minutes)}</Text>
                  </View>
                  <Text style={styles.timerUnit}>{t('minute')}</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerSegment}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNumber}>{padNum(countdown.seconds)}</Text>
                  </View>
                  <Text style={styles.timerUnit}>{t('second')}</Text>
                </View>
              </View>

              <Text style={styles.countdownTime}>{nextPrayer.timeStr}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('todayPrayers')}</Text>
          <Text style={styles.sectionSubtitle}>{t('ummAlQura')}</Text>
        </View>

        <View style={styles.prayerList}>
          {dailyPrayers.prayers.map((prayer, index) => {
            const isPast = prayer.time < now;
            const isNext = nextPrayer?.name === prayer.name;
            const isEnabled = settings.enabledPrayers[prayer.name];
            const IconComponent = PRAYER_ICONS[prayer.name];
            const offset = settings.offsets[prayer.name];

            return (
              <Animated.View
                key={prayer.name}
                style={[
                  styles.prayerCard,
                  isNext && styles.prayerCardActive,
                  isPast && styles.prayerCardPast,
                  {
                    opacity: Animated.multiply(opacityAnims[index], isPast ? 0.55 : 1),
                    transform: [{ translateY: slideAnims[index] }],
                  },
                ]}
              >
                <View style={styles.prayerLeft}>
                  <View
                    style={[
                      styles.prayerIconWrap,
                      isNext && styles.prayerIconWrapActive,
                      isPast && styles.prayerIconWrapPast,
                    ]}
                  >
                    <IconComponent
                      size={20}
                      color={isNext ? Colors.accent : isPast ? Colors.textMuted : Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.prayerInfo}>
                    <View style={styles.prayerNameRow}>
                      <Text
                        style={[
                          styles.prayerNameAr,
                          isNext && styles.prayerNameActive,
                          isPast && styles.prayerNamePast,
                        ]}
                      >
                        {language === 'ar' ? prayer.labelAr : prayer.label}
                      </Text>
                      <Text
                        style={[
                          styles.prayerNameEn,
                          isPast && styles.prayerNamePast,
                        ]}
                      >
                        {language === 'ar' ? prayer.label : prayer.labelAr}
                      </Text>
                    </View>
                    {offset > 0 && (
                      <Text style={styles.offsetBadge}>+{offset} {t('minutes')}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.prayerRight}>
                  <Text
                    style={[
                      styles.prayerTime,
                      isNext && styles.prayerTimeActive,
                      isPast && styles.prayerTimePast,
                    ]}
                  >
                    {prayer.timeStr}
                  </Text>
                  {isEnabled && settings.globalEnabled ? (
                    <Volume2 size={13} color={isNext ? Colors.accent : Colors.textMuted} />
                  ) : (
                    <VolumeX size={13} color={Colors.textMuted} />
                  )}
                </View>
              </Animated.View>
            );
          })}
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
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  appTitle: {
    flexDirection: 'column',
  },
  titleTextAr: {
    fontSize: 26,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: '#FFFFFF',
  },
  countdownCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
  },
  countdownGradient: {
    padding: 24,
    alignItems: 'center',
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  countdownLabel: {
    fontSize: 14,
    fontFamily: 'Dubai-Bold',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  countdownPrayerAr: {
    fontSize: 28,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
  },
  countdownPrayerEn: {
    fontSize: 14,
    fontFamily: 'Dubai-Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    marginBottom: 18,
  },
  countdownTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  timerSegment: {
    alignItems: 'center',
  },
  timerBox: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
    minWidth: 60,
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 32,
    fontFamily: 'Dubai-Light',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerUnit: {
    fontSize: 12,
    fontFamily: 'Dubai-Medium',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  timerColon: {
    fontSize: 28,
    fontFamily: 'Dubai-Light',
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 8,
    marginTop: -16,
  },
  countdownTime: {
    fontSize: 14,
    fontFamily: 'Dubai-Regular',
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  prayerList: {
    gap: 8,
    marginBottom: 24,
  },
  prayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  prayerCardActive: {
    borderColor: 'rgba(201,168,76,0.3)',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  prayerCardPast: {},
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerIconWrapActive: {
    backgroundColor: Colors.accentDim,
  },
  prayerIconWrapPast: {
    backgroundColor: 'rgba(74,102,112,0.2)',
  },
  prayerInfo: {
    gap: 2,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerNameAr: {
    fontSize: 16,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
  },
  prayerNameEn: {
    fontSize: 12,
    fontFamily: 'Dubai-Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  prayerNameActive: {
    color: Colors.accentLight,
  },
  prayerNamePast: {
    color: 'rgba(255,255,255,0.82)',
  },
  offsetBadge: {
    fontSize: 12,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
  },
  prayerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  prayerTime: {
    fontSize: 15,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  prayerTimeActive: {
    color: Colors.accent,
  },
  prayerTimePast: {
    color: 'rgba(255,255,255,0.82)',
  },
  welcomeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  welcomeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  welcomeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  welcomeDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.25)',
    marginVertical: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
    marginBottom: 14,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 17,
    fontFamily: 'Dubai-Medium',
    color: Colors.accentLight,
    textAlign: 'center',
    lineHeight: 28,
  },
  welcomeAppIcon: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },
  welcomeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 24,
    width: '100%',
  },
  welcomeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  welcomeButtonText: {
    fontSize: 17,
    fontFamily: 'Dubai-Bold',
    color: '#0B1A1F',
  },

  aboutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74,102,112,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74,102,112,0.3)',
  },
  aboutMessage: {
    fontSize: 16,
    fontFamily: 'Dubai-Medium',
    color: Colors.accentLight,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 4,
  },
  aboutDua: {
    fontSize: 16,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
});
