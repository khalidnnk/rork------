import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  MapPin,
  Bell,
  BellOff,
  Clock,
  Volume2,
  Play,
  ChevronRight,
  Info,
  Compass,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAthan } from '@/contexts/AthanContext';
import { PrayerName } from '@/utils/prayerTimes';

const OFFSET_OPTIONS = [0, 2, 5];

const PRAYER_LABELS_AR: Record<PrayerName, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings,
    togglePrayer,
    setOffset,
    toggleGlobal,
    setIsAdhanPlaying,
  } = useAthan();

  const handleTestAlarm = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsAdhanPlaying(true);

    Alert.alert(
      'اختبار المنبّه',
      'تم تفعيل الأذان التجريبي! انتقل للصفحة الرئيسية لرؤية زر الإيقاف.\n\nعند دخول وقت الصلاة، سيعمل صوت الأذان المرفق (athan.m4r) كإشعار تلقائي.',
      [{ text: 'حسنًا' }]
    );
  }, [setIsAdhanPlaying]);

  const handleTogglePrayer = useCallback(
    (name: PrayerName) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      togglePrayer(name);
    },
    [togglePrayer]
  );

  const handleSetOffset = useCallback(
    (name: PrayerName, offset: number) => {
      Haptics.selectionAsync();
      setOffset(name, offset);
    },
    [setOffset]
  );

  const handleToggleGlobal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleGlobal();
  }, [toggleGlobal]);

  const prayerNames: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F2229', '#0B1A1F', '#091418']}
        style={StyleSheet.absoluteFill}
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
          <Text style={styles.headerTitle}>الإعدادات</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>المنبّه</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                {settings.globalEnabled ? (
                  <Bell size={18} color={Colors.accent} />
                ) : (
                  <BellOff size={18} color={Colors.danger} />
                )}
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>الأذان العام</Text>
                  <Text style={styles.cardRowSubtitle}>
                    {settings.globalEnabled ? 'الإشعارات مفعّلة' : 'جميع الإشعارات متوقفة'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.globalEnabled}
                onValueChange={handleToggleGlobal}
                trackColor={{ false: Colors.surface, true: Colors.accent }}
                thumbColor={Colors.white}
                testID="global-switch"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.cardRow}
              onPress={handleTestAlarm}
              activeOpacity={0.7}
              testID="test-alarm"
            >
              <View style={styles.cardRowLeft}>
                <Play size={18} color={Colors.accent} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>اختبار المنبّه</Text>
                  <Text style={styles.cardRowSubtitle}>معاينة صوت الأذان</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>تفعيل الصلوات</Text>
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
                    <Text style={styles.prayerToggleName}>{PRAYER_LABELS_AR[name]}</Text>
                  </View>
                  <Switch
                    value={settings.enabledPrayers[name]}
                    onValueChange={() => handleTogglePrayer(name)}
                    trackColor={{ false: Colors.surface, true: Colors.accent }}
                    thumbColor={Colors.white}
                    testID={`toggle-${name}`}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>تأخير وقت الأذان</Text>
          <Text style={styles.sectionDescription}>
            إضافة دقائق بعد وقت الصلاة المحسوب
          </Text>
          <View style={styles.card}>
            {prayerNames.map((name, index) => (
              <View key={name}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.offsetRow}>
                  <Text style={styles.offsetPrayerName}>{PRAYER_LABELS_AR[name]}</Text>
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
                        >
                          <Text
                            style={[
                              styles.offsetChipText,
                              isActive && styles.offsetChipTextActive,
                            ]}
                          >
                            {opt === 0 ? 'دقيق' : `+${opt}`}
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
          <Text style={styles.sectionLabel}>الموقع</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <MapPin size={18} color={Colors.accent} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>الموقع الحالي</Text>
                  <Text style={styles.cardRowSubtitle}>{settings.locationName}</Text>
                </View>
              </View>
              <View style={styles.autoLabel}>
                <Text style={styles.autoLabelText}>تلقائي</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Compass size={18} color={Colors.textSecondary} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>الإحداثيات</Text>
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
                  <Text style={styles.cardRowTitle}>المنطقة الزمنية</Text>
                  <Text style={styles.cardRowSubtitle}>
                    UTC{settings.timezone >= 0 ? '+' : ''}{settings.timezone}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>طريقة الحساب</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Info size={18} color={Colors.textSecondary} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>تقويم أم القرى (مكة)</Text>
                  <Text style={styles.cardRowSubtitle}>
                    الفجر: 18.5° | العشاء: 90 دقيقة بعد المغرب
                  </Text>
                </View>
              </View>
              <View style={styles.lockedLabel}>
                <Text style={styles.lockedLabelText}>ثابت</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>صوت الأذان</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Volume2 size={18} color={Colors.accent} />
                <View style={styles.cardRowTextWrap}>
                  <Text style={styles.cardRowTitle}>athan.m4r</Text>
                  <Text style={styles.cardRowSubtitle}>
                    ملف الأذان المرفق مع التطبيق
                  </Text>
                </View>
              </View>
              <View style={styles.activeLabel}>
                <Text style={styles.activeLabelText}>مُفعّل</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Info size={16} color={Colors.accent} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>حول الإشعارات</Text>
            <Text style={styles.infoText}>
              يحدّ نظام iOS مدة صوت الإشعار بـ 30 ثانية. عند دخول وقت الصلاة، ستتلقى إشعارًا عالي الأولوية مع صوت الأذان المرفق. يتم إعادة جدولة الإشعارات يوميًا.
            </Text>
          </View>
        </View>

        <View style={styles.dedicationCard}>
          <Text style={styles.dedicationText}>
            ليبقى أثر صوته حاضرًا
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginRight: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
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
    fontWeight: '500' as const,
    color: Colors.text,
  },
  cardRowSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.separator,
    marginHorizontal: 16,
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
    fontWeight: '500' as const,
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
    fontWeight: '500' as const,
    color: Colors.text,
  },
  offsetOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  offsetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  offsetChipTextActive: {
    color: Colors.accent,
  },
  autoLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.successDim,
  },
  autoLabelText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  activeLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.accentDim,
  },
  activeLabelText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  lockedLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  lockedLabelText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.accentSoft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  infoText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 18,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  dedicationCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  dedicationText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500' as const,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
