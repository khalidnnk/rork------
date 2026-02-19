import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  MapPin,
  Bell,
  BellOff,
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
  Play,
  Square,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAthan } from '@/contexts/AthanContext';
import { getTimeUntil, PrayerName } from '@/utils/prayerTimes';

function AthanPlayerModal({ visible, onStop, playerStatus }: { visible: boolean; onStop: () => void; playerStatus: { currentTime: number; duration: number; playing: boolean } }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const waveAnim3 = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
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
  }, [visible]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      onStop();
    });
  }, [onStop, fadeAnim, scaleAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress = playerStatus.duration > 0 ? playerStatus.currentTime / playerStatus.duration : 0;
  const elapsed = Math.floor(playerStatus.currentTime);
  const total = Math.floor(playerStatus.duration);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
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

          <Text style={athanStyles.playingLabel}>جارٍ تشغيل الأذان</Text>
          <Text style={athanStyles.playingBismillah}>الله أكبر الله أكبر</Text>

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
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={athanStyles.stopButtonGradient}
            >
              <Square size={22} color="#fff" fill="#fff" />
              <Text style={athanStyles.stopButtonText}>إيقاف الأذان</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const PRAYER_ICONS: Record<PrayerName, React.ComponentType<{ size: number; color: string }>> = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
};

function AboutModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const aboutFadeAnim = useRef(new Animated.Value(0)).current;
  const aboutScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const handleDismiss = useCallback(() => {
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
  }, [onDismiss, aboutFadeAnim, aboutScaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.welcomeOverlay, { opacity: aboutFadeAnim }]}>
        <Animated.View style={[styles.welcomeCard, { transform: [{ scale: aboutScaleAnim }] }]}>
          <LinearGradient
            colors={['#132D38', '#0F2229', '#0B1A1F']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeIconWrap}>
              <Heart size={32} color={Colors.accent} fill={Colors.accent} />
            </View>

            <Text style={styles.welcomeBismillah}>بسم الله الرحمن الرحيم</Text>

            <View style={styles.welcomeDivider} />

            <Text style={styles.welcomeTitle}>عن التطبيق</Text>

            <Text style={styles.aboutMessage}>
              تم إنشاء هذا التطبيق احتساباً للأجر عن عبدالرحمن السليماني
            </Text>

            <View style={styles.welcomeDivider} />

            <Text style={styles.aboutDua}>
              اللهم اجعل له أجراً ومغفرة بكل (الله أكبر) ترفع في هذا التطبيق
            </Text>

            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.welcomeAppIcon}
              contentFit="cover"
            />

            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.accent, '#B8922E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.welcomeButtonGradient}
              >
                <Text style={styles.welcomeButtonText}>إغلاق</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function WelcomeModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const handleDismiss = useCallback(() => {
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
  }, [onDismiss, fadeAnim, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.welcomeOverlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.welcomeCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#132D38', '#0F2229', '#0B1A1F']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeIconWrap}>
              <Heart size={32} color={Colors.accent} fill={Colors.accent} />
            </View>

            <Text style={styles.welcomeBismillah}>بسم الله الرحمن الرحيم</Text>

            <View style={styles.welcomeDivider} />

            <Text style={styles.welcomeTitle}>أذان السليماني</Text>

            <Text style={styles.welcomeMessage}>
              ليبقى أثر صوته حاضرًا،{'\n'}
              يصدح بالأذان في كل وقت صلاة
            </Text>

            <View style={styles.welcomeDivider} />

            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.welcomeAppIcon}
              contentFit="cover"
            />

            <TouchableOpacity
              style={styles.welcomeButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.accent, '#B8922E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.welcomeButtonGradient}
              >
                <Text style={styles.welcomeButtonText}>ابدأ</Text>
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
  const {
    settings,
    dailyPrayers,
    nextPrayer,
    locationLoading,
    toggleGlobal,
    isAdhanPlaying,
    playAthan,
    stopAthan,
    dismissWelcome,
    playerStatus,
  } = useAthan();

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    dailyPrayers.prayers.map(() => new Animated.Value(40))
  ).current;
  const opacityAnims = useRef(
    dailyPrayers.prayers.map(() => new Animated.Value(0))
  ).current;
  const countdownScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
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
  }, []);

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

  useEffect(() => {
    if (!isAdhanPlaying) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isAdhanPlaying]);

  const handlePlayAthan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playAthan();
  }, [playAthan]);

  const handleStopAdhan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopAthan();
  }, [stopAthan]);

  const handleToggleGlobal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleGlobal();
  }, [toggleGlobal]);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    dismissWelcome();
  }, [dismissWelcome]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const padNum = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F2229', '#0B1A1F', '#091418']}
        style={StyleSheet.absoluteFill}
      />

      <WelcomeModal visible={showWelcome} onDismiss={handleDismissWelcome} />
      <AboutModal visible={showAbout} onDismiss={() => setShowAbout(false)} />
      <AthanPlayerModal
        visible={isAdhanPlaying}
        onStop={handleStopAdhan}
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
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View style={styles.appTitleRow}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.appIcon}
                contentFit="cover"
              />
              <View style={styles.appTitle}>
                <Text style={styles.titleTextAr}>أذان السليماني</Text>
                <Text style={styles.subtitleText}>Alsulaimani Athan</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.aboutButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAbout(true);
                }}
                activeOpacity={0.7}
                testID="about-button"
              >
                <Info size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.globalToggle,
                  { backgroundColor: settings.globalEnabled ? Colors.accentDim : Colors.dangerDim },
                ]}
                onPress={handleToggleGlobal}
                activeOpacity={0.7}
                testID="global-toggle"
              >
                {settings.globalEnabled ? (
                  <Bell size={18} color={Colors.accent} />
                ) : (
                  <BellOff size={18} color={Colors.danger} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.locationText}>
              {locationLoading ? 'جارٍ تحديد الموقع...' : settings.locationName}
            </Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
        </Animated.View>

        <TouchableOpacity
          style={styles.playAthanCard}
          onPress={handlePlayAthan}
          activeOpacity={0.8}
          testID="play-athan"
        >
          <LinearGradient
            colors={[Colors.accent, '#B8922E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playAthanGradient}
          >
            <Play size={22} color="#0B1A1F" fill="#0B1A1F" />
            <Text style={styles.playAthanText}>تشغيل الأذان</Text>
          </LinearGradient>
        </TouchableOpacity>

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
                <Text style={styles.countdownLabel}>الصلاة القادمة</Text>
              </View>

              <Text style={styles.countdownPrayerAr}>{nextPrayer.labelAr}</Text>
              <Text style={styles.countdownPrayerEn}>{nextPrayer.label}</Text>

              <View style={styles.countdownTimerRow}>
                <View style={styles.timerSegment}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNumber}>{padNum(countdown.hours)}</Text>
                  </View>
                  <Text style={styles.timerUnit}>ساعة</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerSegment}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNumber}>{padNum(countdown.minutes)}</Text>
                  </View>
                  <Text style={styles.timerUnit}>دقيقة</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerSegment}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNumber}>{padNum(countdown.seconds)}</Text>
                  </View>
                  <Text style={styles.timerUnit}>ثانية</Text>
                </View>
              </View>

              <Text style={styles.countdownTime}>{nextPrayer.timeStr}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>مواقيت اليوم</Text>
          <Text style={styles.sectionSubtitle}>تقويم أم القرى</Text>
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
                    opacity: opacityAnims[index],
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
                        {prayer.labelAr}
                      </Text>
                      <Text
                        style={[
                          styles.prayerNameEn,
                          isPast && styles.prayerNamePast,
                        ]}
                      >
                        {prayer.label}
                      </Text>
                    </View>
                    {offset > 0 && (
                      <Text style={styles.offsetBadge}>+{offset} دقيقة</Text>
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
    writingDirection: 'rtl',
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: 'Dubai-Medium',
    color: Colors.accent,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  globalToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Dubai-Regular',
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Dubai-Regular',
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  playAthanCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  playAthanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  playAthanText: {
    fontSize: 18,
    fontFamily: 'Dubai-Bold',
    color: '#0B1A1F',
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
    fontSize: 12,
    fontFamily: 'Dubai-Medium',
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
    color: Colors.textSecondary,
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
    fontSize: 10,
    fontFamily: 'Dubai-Regular',
    color: Colors.textMuted,
    marginTop: 4,
  },
  timerColon: {
    fontSize: 28,
    fontFamily: 'Dubai-Light',
    color: Colors.textMuted,
    marginHorizontal: 8,
    marginTop: -16,
  },
  countdownTime: {
    fontSize: 14,
    fontFamily: 'Dubai-Regular',
    color: Colors.textSecondary,
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
    fontSize: 11,
    fontFamily: 'Dubai-Regular',
    color: Colors.textMuted,
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
  prayerCardPast: {
    opacity: 0.45,
  },
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
    color: Colors.textSecondary,
  },
  prayerNameActive: {
    color: Colors.accentLight,
  },
  prayerNamePast: {
    color: Colors.textMuted,
  },
  offsetBadge: {
    fontSize: 10,
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
    color: Colors.textMuted,
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
  welcomeBismillah: {
    fontSize: 16,
    fontFamily: 'Dubai-Regular',
    color: Colors.accent,
    marginBottom: 16,
    textAlign: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 17,
    fontFamily: 'Dubai-Medium',
    color: Colors.accentLight,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 4,
  },
  aboutDua: {
    fontSize: 16,
    fontFamily: 'Dubai-Bold',
    color: Colors.accent,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
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
    fontFamily: 'Dubai-Regular',
    color: Colors.textMuted,
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
