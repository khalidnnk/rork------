export interface City {
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export const CITIES: City[] = [
  { name: 'Riyadh', nameAr: 'الرياض', latitude: 24.7136, longitude: 46.6753, timezone: 3 },
  { name: 'Makkah', nameAr: 'مكة المكرمة', latitude: 21.4225, longitude: 39.8262, timezone: 3 },
  { name: 'Madinah', nameAr: 'المدينة المنورة', latitude: 24.4672, longitude: 39.6024, timezone: 3 },
  { name: 'Jeddah', nameAr: 'جدة', latitude: 21.4858, longitude: 39.1925, timezone: 3 },
  { name: 'Dammam', nameAr: 'الدمام', latitude: 26.3927, longitude: 49.9777, timezone: 3 },
  { name: 'Tabuk', nameAr: 'تبوك', latitude: 28.3838, longitude: 36.5550, timezone: 3 },
  { name: 'Abha', nameAr: 'أبها', latitude: 18.2164, longitude: 42.5053, timezone: 3 },
  { name: 'Qassim', nameAr: 'القصيم', latitude: 26.3260, longitude: 43.9750, timezone: 3 },
  { name: 'Hail', nameAr: 'حائل', latitude: 27.5114, longitude: 41.7208, timezone: 3 },
  { name: 'Jizan', nameAr: 'جازان', latitude: 16.8892, longitude: 42.5611, timezone: 3 },
  { name: 'Najran', nameAr: 'نجران', latitude: 17.4933, longitude: 44.1277, timezone: 3 },
  { name: 'Al Khobar', nameAr: 'الخبر', latitude: 26.2172, longitude: 50.1971, timezone: 3 },
];

export const DEFAULT_CITY = CITIES[0];
