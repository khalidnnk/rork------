import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AppState } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppLanguage,
  LANGUAGE_STORAGE_KEY,
  LanguagePreference,
  TranslationKey,
  getDeviceLanguage,
  getStoredLanguagePreference,
  resolveLanguage,
  translate,
} from '@/utils/i18n';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [preference, setPreferenceState] = useState<LanguagePreference>('system');
  const [systemLanguage, setSystemLanguage] = useState<AppLanguage>(getDeviceLanguage());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void getStoredLanguagePreference().then((stored) => {
      setPreferenceState(stored);
      setSystemLanguage(getDeviceLanguage());
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && preference === 'system') setSystemLanguage(getDeviceLanguage());
    });
    return () => subscription.remove();
  }, [preference]);

  const setPreference = useCallback(async (next: LanguagePreference) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setPreferenceState(next);
    if (next === 'system') setSystemLanguage(getDeviceLanguage());
  }, []);

  const language = preference === 'system' ? systemLanguage : resolveLanguage(preference);
  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values),
    [language]
  );

  return useMemo(() => ({
    preference,
    setPreference,
    language,
    isArabic: language === 'ar',
    isRTL: language === 'ar',
    isReady,
    t,
  }), [preference, setPreference, language, isReady, t]);
});
