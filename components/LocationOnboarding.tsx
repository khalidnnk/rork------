import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';

interface LocationOnboardingProps {
  onComplete: (granted: boolean) => void;
}

export default function LocationOnboarding({ onComplete }: LocationOnboardingProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const featureAnims = useRef([
    new Animated.Value(30),
    new Animated.Value(30),
    new Animated.Value(30),
  ]).current;
  const featureOpacities = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    featureAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          delay: 500 + i * 150,
          useNativeDriver: true,
        }),
        Animated.timing(featureOpacities[i], {
          toValue: 1,
          duration: 400,
          delay: 500 + i * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });

    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 500,
      delay: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim, iconScale, featureAnims, featureOpacities, buttonAnim]);

  const handleAllow = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        onComplete(true);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[LocationOnboarding] Permission result:', status);
      onComplete(status === 'granted');
    } catch (e) {
      console.error('[LocationOnboarding] Permission error:', e);
      onComplete(false);
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    console.log('[LocationOnboarding] User skipped location permission');
    onComplete(false);
  }, [onComplete]);

  const features = [
    {
      icon: <Navigation size={20} color={Colors.accent} />,
      title: 'مواقيت دقيقة حسب موقعك',
      subtitle: 'حساب أوقات الصلاة بدقة بناءً على إحداثياتك الجغرافية',
    },
    {
      icon: <MapPin size={20} color={Colors.accent} />,
      title: 'تحديد المدينة تلقائياً',
      subtitle: 'معرفة مدينتك لعرض اسمها وضبط التوقيت المحلي',
    },
    {
      icon: <Shield size={20} color={Colors.teal} />,
      title: 'خصوصيتك محفوظة',
      subtitle: 'لا يتم مشاركة موقعك أو تخزينه خارج جهازك',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F2229', '#0B1A1F', '#091418']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.topSection}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
            <LinearGradient
              colors={['rgba(201,168,76,0.2)', 'rgba(201,168,76,0.05)']}
              style={styles.iconCircleOuter}
            >
              <View style={styles.iconCircleInner}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.appIcon}
                  contentFit="cover"
                />
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>أذان السليماني</Text>
          <Text style={styles.subtitle}>
            يحتاج التطبيق إلى موقعك لحساب{'\n'}مواقيت الصلاة بدقة في منطقتك
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureRow,
                {
                  opacity: featureOpacities[index],
                  transform: [{ translateY: featureAnims[index] }],
                },
              ]}
            >
              <View style={styles.featureIconWrap}>
                {feature.icon}
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={[styles.bottomSection, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleAllow}
            activeOpacity={0.8}
            testID="location-allow-button"
          >
            <LinearGradient
              colors={[Colors.accent, '#B8922E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.allowButtonGradient}
            >
              <MapPin size={20} color="#0B1A1F" />
              <Text style={styles.allowButtonText}>السماح بتحديد الموقع</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            testID="location-skip-button"
          >
            <Text style={styles.skipButtonText}>تخطي واختيار المدينة يدوياً</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Dubai-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresSection: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19,45,56,0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,61,74,0.5)',
    gap: 14,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
    textAlign: 'right',
  },
  featureSubtitle: {
    fontSize: 12,
    fontFamily: 'Dubai-Regular',
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 18,
  },
  bottomSection: {
    gap: 14,
    paddingBottom: 10,
  },
  allowButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  allowButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  allowButtonText: {
    fontSize: 18,
    fontFamily: 'Dubai-Bold',
    color: '#0B1A1F',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Dubai-Medium',
    color: Colors.textMuted,
  },
});
