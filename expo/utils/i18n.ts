import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_CITIES, City } from '@/constants/cities';

export type AppLanguage = 'ar' | 'en';
export type LanguagePreference = 'system' | AppLanguage;

export const LANGUAGE_STORAGE_KEY = 'app_language_preference_v1';

const ar = {
  appName: 'أذان السليماني',
  appNameEn: 'Alsulaimani Athan',
  about: 'عن التطبيق',
  close: 'إغلاق',
  start: 'ابدأ',
  imageLabel: 'صورة عبدالرحمن السليماني',
  aboutCreated: 'تم إنشاء هذا التطبيق احتساباً للأجر عن عبدالرحمن السليماني',
  aboutDua: 'اللهم اجعل له أجراً ومغفرة بكل (الله أكبر) ترفع في هذا التطبيق',
  dedication: 'ليبقى أثر صوته حاضرًا',
  welcomeSubtitle: 'ليبقى أثر صوته حاضرًا،\nيصدح بالأذان في كل وقت صلاة',
  locating: 'جارٍ تحديد الموقع...',
  updating: 'جارٍ التحديث...',
  nextPrayer: 'الصلاة القادمة',
  hour: 'ساعة',
  minute: 'دقيقة',
  second: 'ثانية',
  todayPrayers: 'مواقيت اليوم',
  ummAlQura: 'تقويم أم القرى',
  minutes: 'دقيقة',
  prayerTimes: 'المواقيت',
  settings: 'الإعدادات',
  openSettings: 'فتح الإعدادات',
  backPrayerTimes: 'العودة إلى صفحة المواقيت',
  language: 'اللغة',
  languageDescription: 'يتبع التطبيق لغة الجهاز تلقائيًا أو يمكنك اختيارها يدويًا',
  systemLanguage: 'لغة الجهاز',
  arabic: 'العربية',
  english: 'English',
  alarm: 'المنبّه',
  globalAthan: 'الأذان العام',
  notificationsEnabled: 'الإشعارات مفعّلة',
  notificationsDisabled: 'جميع الإشعارات متوقفة',
  enableAllAlerts: 'تفعيل جميع تنبيهات الأذان',
  playAthan: 'تشغيل الأذان',
  playFullAthan: 'تشغيل الأذان كاملاً',
  stopAthan: 'إيقاف الأذان',
  playingAthan: 'جارٍ تشغيل الأذان',
  playingTakbir: 'الله أكبر الله أكبر',
  notificationSound: 'صوت التنبيه',
  notificationSoundDescription: 'اختر الصوت الذي يصدر عند وقت الصلاة',
  fullAthan: 'الأذان كاملاً',
  fullAthanDescription: '٣٠ ثانية في التنبيه ويكمل داخل التطبيق',
  haya: 'حي على الصلاة',
  hayaDescription: 'مقطع قصير من الأذان',
  allahuAkbar: 'الله أكبر',
  allahuAkbarDescription: 'تكبيرة تنبيه',
  systemSound: 'صوت النظام',
  systemSoundDescription: 'نغمة التنبيه الافتراضية',
  silent: 'صامت',
  silentDescription: 'بدون صوت',
  previewSound: 'معاينة صوت {sound}',
  enabled: 'مفعّل',
  enablePrayers: 'تفعيل الصلوات',
  enablePrayerAlert: 'تفعيل تنبيه صلاة {prayer}',
  delayAthan: 'تأخير وقت الأذان',
  delayDescription: 'إضافة دقائق بعد وقت الصلاة المحسوب',
  noDelay: 'بدون تأخير',
  onTime: 'دقيق',
  delayMinutes: 'تأخير {minutes} دقائق',
  location: 'الموقع',
  currentLocation: 'الموقع الحالي',
  travelUpdates: 'التحديث أثناء السفر',
  travelUpdatesDescription: 'يحدّث الموقع والمواقيت تلقائيًا عند الانتقال لمسافة ملحوظة',
  travelUpdatesLabel: 'تحديث الموقع ومواقيت الصلاة تلقائيًا أثناء السفر',
  coordinates: 'الإحداثيات',
  timezone: 'المنطقة الزمنية',
  autoGps: 'تحديد تلقائي GPS',
  refreshGpsLabel: 'تحديث الموقع الحالي باستخدام GPS',
  manualCity: 'اختيار المدينة يدوياً',
  manualCityLabel: 'اختيار المدينة يدويًا',
  alwaysLocationTitle: 'يلزم السماح بالموقع دائمًا',
  alwaysLocationMessage: 'لتحديث مواقيت الصلاة عند السفر دون فتح التطبيق، اختر السماح بالموقع دائمًا من إعدادات الجهاز.',
  backgroundLocationDisclosureTitle: 'تحديث المواقيت أثناء السفر',
  backgroundLocationDisclosureMessage: 'عند تفعيل هذه الميزة سيطلب التطبيق صلاحية الموقع «دائمًا». يستخدم التطبيق تحديثات الموقع في الخلفية فقط بعد انتقالك لمسافة ملحوظة (10 كم أو أكثر) لتحديد منطقتك الجديدة، وإعادة حساب مواقيت الصلوات الخمس وجدولة تنبيهاتها دون الحاجة لفتح التطبيق.\n\nيُحفظ آخر موقع فقط داخل جهازك، ولا يُحفظ سجل تحركاتك ولا تُشارك بيانات موقعك مع أي جهة خارجية. يمكنك إيقاف الميزة في أي وقت.',
  continueEnable: 'متابعة وتفعيل',
  cancel: 'إلغاء',
  autoUpdateFailed: 'تعذر تفعيل التحديث التلقائي',
  checkLocationPermission: 'تأكد من صلاحية الموقع ثم حاول مرة أخرى.',
  calculationMethod: 'طريقة الحساب',
  ummAlQuraMakkah: 'تقويم أم القرى (مكة)',
  offlineCalculation: 'تُحسب المواقيت داخل الجهاز وتعمل دون إنترنت',
  fixed: 'ثابت',
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
  ishaAfterMaghrib: '90 د بعد المغرب',
  ramadan: 'رمضان',
  ramadanIsha: 'العشاء في رمضان',
  ramadanIshaDetail: '120 دقيقة بعد المغرب (بدلاً من 90)',
  chooseCity: 'اختيار المدينة',
  closeCityPicker: 'إغلاق اختيار المدينة',
  citySearch: 'ابحث عن مدينة أو دولة...',
  citySearchLabel: 'البحث عن مدينة أو دولة',
  clearSearch: 'مسح البحث',
  noResults: 'لا توجد نتائج',
  chooseCityLabel: 'اختيار مدينة {city}',
  onboardingAccurateTitle: 'مواقيت دقيقة حسب موقعك',
  onboardingAccurateSubtitle: 'حساب أوقات الصلاة بدقة بناءً على إحداثياتك الجغرافية',
  onboardingTravelTitle: 'تحديث تلقائي أثناء السفر',
  onboardingTravelSubtitle: 'يمكنك لاحقاً تفعيل الموقع دائماً لتحديث المواقيت عند الانتقال دون فتح التطبيق',
  onboardingPrivacyTitle: 'خصوصيتك محفوظة',
  onboardingPrivacySubtitle: 'يُستخدم الموقع لتحديد المدينة وحساب المواقيت عند اختيارك السماح',
  onboardingIntro: 'يستخدم التطبيق موقعك أثناء الاستخدام لتحديد مدينتك وحساب مواقيت الصلاة بدقة. ويمكنك تفعيل التحديث أثناء السفر من الإعدادات',
  allowLocation: 'السماح بتحديد الموقع',
  allowLocationLabel: 'السماح بتحديد الموقع أثناء استخدام التطبيق',
  skipManual: 'تخطي واختيار المدينة يدوياً',
  skipManualLabel: 'تخطي تحديد الموقع واختيار المدينة يدويًا',
  previewTitle: 'معاينة صوت التنبيه',
  previewBody: 'هذا هو صوت التنبيه الافتراضي',
  listenFullAthan: 'استمع للأذان كاملاً',
  openApp: 'فتح التطبيق',
  prayerTimeTitle: 'حان وقت صلاة {prayer}',
  jumuahPrayerTimeTitle: 'حان وقت صلاة الجمعة',
  fullAthanBody: '{prayer} - {time} | افتح للاستماع للأذان كاملاً',
  prayerBody: '{prayer} - {time}',
  renewalTitle: 'تجديد تنبيهات الأذان 🤍',
  renewalBody: 'افتح التطبيق لتجديد التنبيهات للأيام القادمة.\n{reason}',
  renewalReasonIos: 'السبب: نظام iPhone يحد عدد التنبيهات التي يمكن جدولتها مسبقًا، وفتح التطبيق يجددها تلقائيًا.',
  renewalReasonOther: 'السبب: فتح التطبيق يجدد جدول تنبيهات الأذان تلقائيًا.',
  locationUpdated: 'تم تحديث مواقيت الصلاة حسب موقعك الحالي: {location}',
  locationUpdatedPrivate: 'تم تحديث مواقيت الصلاة حسب موقعك الحالي.',
  newArea: 'المنطقة الجديدة',
  yourCurrentLocation: 'موقعك الحالي',
  backgroundUpdate: 'تحديث مواقيت الصلاة تلقائيًا عند السفر',
  back: 'رجوع',
  notFound: 'الصفحة غير موجودة',
  returnPrayerTimes: 'العودة إلى المواقيت',
} as const;

type TranslationKey = keyof typeof ar;

const en: Record<TranslationKey, string> = {
  appName: 'Alsulaimani Athan', appNameEn: 'Alsulaimani Athan', about: 'About', close: 'Close', start: 'Start',
  imageLabel: 'Photo of Abdulrahman Alsulaimani', aboutCreated: 'This app was created as an ongoing charity in memory of Abdulrahman Alsulaimani.',
  aboutDua: 'May Allah grant him reward and forgiveness for every “Allahu Akbar” heard through this app.', dedication: 'So his voice may live on',
  welcomeSubtitle: 'So his voice may live on,\ncalling the Athan at every prayer time', locating: 'Locating...', updating: 'Updating...',
  nextPrayer: 'Next prayer', hour: 'Hour', minute: 'Minute', second: 'Second', todayPrayers: "Today's prayer times", ummAlQura: 'Umm Al-Qura Calendar', minutes: 'min',
  prayerTimes: 'Prayer Times', settings: 'Settings', openSettings: 'Open settings', backPrayerTimes: 'Return to prayer times',
  language: 'Language', languageDescription: 'Follow the device language automatically or choose one manually', systemLanguage: 'Device Language', arabic: 'العربية', english: 'English',
  alarm: 'Alerts', globalAthan: 'All Athan alerts', notificationsEnabled: 'Notifications are enabled', notificationsDisabled: 'All notifications are off', enableAllAlerts: 'Enable all Athan alerts',
  playAthan: 'Play Athan', playFullAthan: 'Play the full Athan', stopAthan: 'Stop Athan', playingAthan: 'Playing Athan', playingTakbir: 'Allahu Akbar, Allahu Akbar', notificationSound: 'Alert sound', notificationSoundDescription: 'Choose the sound played at prayer time',
  fullAthan: 'Full Athan', fullAthanDescription: '30 seconds in the alert, then continues in the app', haya: 'Hayya alas-Salah', hayaDescription: 'A short clip from the Athan', allahuAkbar: 'Allahu Akbar', allahuAkbarDescription: 'Takbir alert', systemSound: 'System sound', systemSoundDescription: 'Default notification tone', silent: 'Silent', silentDescription: 'No sound', previewSound: 'Preview {sound}', enabled: 'Enabled',
  enablePrayers: 'Prayer alerts', enablePrayerAlert: 'Enable {prayer} prayer alert', delayAthan: 'Athan delay', delayDescription: 'Add minutes after the calculated prayer time', noDelay: 'No delay', onTime: 'On time', delayMinutes: 'Delay {minutes} minutes',
  location: 'Location', currentLocation: 'Current location', travelUpdates: 'Update while traveling', travelUpdatesDescription: 'Automatically updates location and prayer times after significant travel', travelUpdatesLabel: 'Automatically update location and prayer times while traveling', coordinates: 'Coordinates', timezone: 'Time zone', autoGps: 'Automatic GPS', refreshGpsLabel: 'Refresh current location using GPS', manualCity: 'Choose city manually', manualCityLabel: 'Choose city manually',
  alwaysLocationTitle: 'Always Location access required', alwaysLocationMessage: 'To update prayer times while traveling without opening the app, choose Always for Location in device Settings.', backgroundLocationDisclosureTitle: 'Update prayer times while traveling', backgroundLocationDisclosureMessage: 'When you enable this feature, the app will request Always Location access. The app processes background location updates only after you travel a significant distance (10 km or more) to identify your new area, recalculate the five daily prayer times, and reschedule their alerts without requiring you to open the app.\n\nOnly your latest location is stored on your device. The app does not keep a location history or share location data with external services. You can turn this feature off at any time.', continueEnable: 'Continue and Enable', cancel: 'Cancel', autoUpdateFailed: 'Could not enable automatic updates', checkLocationPermission: 'Check Location permission and try again.',
  calculationMethod: 'Calculation method', ummAlQuraMakkah: 'Umm Al-Qura (Makkah)', offlineCalculation: 'Prayer times are calculated on the device and work offline', fixed: 'Fixed', fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', ishaAfterMaghrib: '90 min after Maghrib', ramadan: 'Ramadan', ramadanIsha: 'Isha in Ramadan', ramadanIshaDetail: '120 minutes after Maghrib (instead of 90)',
  chooseCity: 'Choose City', closeCityPicker: 'Close city picker', citySearch: 'Search for a city or country...', citySearchLabel: 'Search for a city or country', clearSearch: 'Clear search', noResults: 'No results', chooseCityLabel: 'Choose {city}',
  onboardingAccurateTitle: 'Accurate times for your location', onboardingAccurateSubtitle: 'Prayer times are calculated precisely from your coordinates', onboardingTravelTitle: 'Automatic travel updates', onboardingTravelSubtitle: 'You can later enable Always Location to update times when you travel without opening the app', onboardingPrivacyTitle: 'Your privacy is protected', onboardingPrivacySubtitle: 'Location is used only to identify your area and calculate prayer times when you allow it', onboardingIntro: 'The app uses your location while in use to identify your area and calculate accurate prayer times. Travel updates can be enabled later in Settings.', allowLocation: 'Allow Location', allowLocationLabel: 'Allow location while using the app', skipManual: 'Skip and choose a city manually', skipManualLabel: 'Skip location and choose a city manually',
  previewTitle: 'Alert sound preview', previewBody: 'This is the default alert sound', listenFullAthan: 'Listen to the full Athan', openApp: 'Open app', prayerTimeTitle: 'It is time for {prayer} prayer', jumuahPrayerTimeTitle: "It is time for Jumu'ah prayer", fullAthanBody: '{prayer} - {time} | Open to listen to the full Athan', prayerBody: '{prayer} - {time}', renewalTitle: 'Renew Athan notifications 🤍', renewalBody: 'Open the app to renew notifications for the coming days.\n{reason}', renewalReasonIos: 'Reason: iPhone limits the number of notifications that can be scheduled in advance. Opening the app renews them automatically.', renewalReasonOther: 'Reason: Opening the app renews the Athan notification schedule automatically.', locationUpdated: 'Prayer times have been updated for your current location: {location}', locationUpdatedPrivate: 'Prayer times have been updated for your current location.', newArea: 'New area', yourCurrentLocation: 'Your current location', backgroundUpdate: 'Automatically updating prayer times while traveling', back: 'Back', notFound: 'Page not found', returnPrayerTimes: 'Return to Prayer Times',
};

const translations = { ar, en };

export function getDeviceLanguage(): AppLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith('ar') ? 'ar' : 'en';
}

export function resolveLanguage(preference: LanguagePreference): AppLanguage {
  return preference === 'system' ? getDeviceLanguage() : preference;
}

export async function getStoredLanguagePreference(): Promise<LanguagePreference> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'ar' || stored === 'en' || stored === 'system' ? stored : 'system';
}

export async function getStoredLanguage(): Promise<AppLanguage> {
  return resolveLanguage(await getStoredLanguagePreference());
}

export function translate(language: AppLanguage, key: TranslationKey, values: Record<string, string | number> = {}): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    translations[language][key] as string
  );
}

export function localizedCityName(city: City, language: AppLanguage): string {
  return language === 'ar' ? city.nameAr : city.name;
}

export function localizedLocationName(name: string, latitude: number, longitude: number, language: AppLanguage): string {
  const match = ALL_CITIES.find((city) =>
    city.name === name || city.nameAr === name ||
    (Math.abs(city.latitude - latitude) < 0.002 && Math.abs(city.longitude - longitude) < 0.002)
  );
  return match ? localizedCityName(match, language) : name;
}

export type { TranslationKey };
