import * as Location from 'expo-location';
import { ALL_CITIES } from '@/constants/cities';
import { AppLanguage, translate } from '@/utils/i18n';

export const ATHAN_SETTINGS_STORAGE_KEY = 'athan_settings_v3';

type ResolvedLocation = {
  name: string;
  countryCode?: string;
};

const COUNTRY_CODES: Record<string, string> = {
  Algeria: 'DZ',
  Bahrain: 'BH',
  Comoros: 'KM',
  Djibouti: 'DJ',
  Egypt: 'EG',
  Iraq: 'IQ',
  Jordan: 'JO',
  Kuwait: 'KW',
  Lebanon: 'LB',
  Libya: 'LY',
  Mauritania: 'MR',
  Morocco: 'MA',
  Oman: 'OM',
  Palestine: 'PS',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  Somalia: 'SO',
  Sudan: 'SD',
  Syria: 'SY',
  Tunisia: 'TN',
  UAE: 'AE',
  Yemen: 'YE',
};

function distanceInMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB))
    * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveLocation(
  latitude: number,
  longitude: number,
  language: AppLanguage = 'ar'
): Promise<ResolvedLocation> {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = addresses[0];
    if (address) {
      return {
        name: address.city
          || address.district
          || address.subregion
          || address.region
          || address.country
          || translate(language, 'newArea'),
        countryCode: address.isoCountryCode || undefined,
      };
    }
  } catch (error) {
    console.log('[BackgroundLocation] Reverse geocode failed:', error);
  }

  const nearestCity = ALL_CITIES.reduce<ResolvedLocation & { distance: number } | null>((nearest, city) => {
    const distance = distanceInMeters(latitude, longitude, city.latitude, city.longitude);
    if (!nearest || distance < nearest.distance) {
      return {
        name: language === 'ar' ? city.nameAr : city.name,
        countryCode: COUNTRY_CODES[city.country],
        distance,
      };
    }
    return nearest;
  }, null);

  return nearestCity && nearestCity.distance <= 150_000
    ? nearestCity
    : { name: translate(language, 'yourCurrentLocation') };
}

export async function resolveLocationName(
  latitude: number,
  longitude: number,
  language: AppLanguage = 'ar'
): Promise<string> {
  return (await resolveLocation(latitude, longitude, language)).name;
}
