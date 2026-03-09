export interface City {
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  timezone: number;
  country: string;
  countryAr: string;
}

export interface CountryGroup {
  country: string;
  countryAr: string;
  cities: City[];
}

const makeCities = (country: string, countryAr: string, timezone: number, cities: [string, string, number, number][]): City[] =>
  cities.map(([name, nameAr, latitude, longitude]) => ({ name, nameAr, latitude, longitude, timezone, country, countryAr }));

const SAUDI_CITIES = makeCities('Saudi Arabia', 'السعودية', 3, [
  ['Riyadh', 'الرياض', 24.7136, 46.6753],
  ['Makkah', 'مكة المكرمة', 21.4225, 39.8262],
  ['Madinah', 'المدينة المنورة', 24.4672, 39.6024],
  ['Jeddah', 'جدة', 21.4858, 39.1925],
  ['Dammam', 'الدمام', 26.3927, 49.9777],
  ['Tabuk', 'تبوك', 28.3838, 36.5550],
  ['Abha', 'أبها', 18.2164, 42.5053],
  ['Qassim', 'القصيم', 26.3260, 43.9750],
  ['Hail', 'حائل', 27.5114, 41.7208],
  ['Jizan', 'جازان', 16.8892, 42.5611],
  ['Najran', 'نجران', 17.4933, 44.1277],
  ['Al Khobar', 'الخبر', 26.2172, 50.1971],
  ['Taif', 'الطائف', 21.2703, 40.4158],
  ['Yanbu', 'ينبع', 24.0895, 38.0618],
  ['Al Ahsa', 'الأحساء', 25.3648, 49.5888],
  ['Jubail', 'الجبيل', 27.0046, 49.6225],
  ['Khamis Mushait', 'خميس مشيط', 18.3066, 42.7283],
  ['Al Baha', 'الباحة', 20.0000, 41.4667],
]);

const UAE_CITIES = makeCities('UAE', 'الإمارات', 4, [
  ['Dubai', 'دبي', 25.2048, 55.2708],
  ['Abu Dhabi', 'أبوظبي', 24.4539, 54.3773],
  ['Sharjah', 'الشارقة', 25.3463, 55.4209],
  ['Al Ain', 'العين', 24.1917, 55.7606],
  ['Ajman', 'عجمان', 25.4052, 55.5136],
  ['Ras Al Khaimah', 'رأس الخيمة', 25.7895, 55.9432],
  ['Fujairah', 'الفجيرة', 25.1288, 56.3265],
]);

const KUWAIT_CITIES = makeCities('Kuwait', 'الكويت', 3, [
  ['Kuwait City', 'مدينة الكويت', 29.3759, 47.9774],
  ['Ahmadi', 'الأحمدي', 29.0769, 48.0838],
  ['Hawalli', 'حولي', 29.3328, 48.0286],
  ['Jahra', 'الجهراء', 29.3375, 47.6581],
]);

const QATAR_CITIES = makeCities('Qatar', 'قطر', 3, [
  ['Doha', 'الدوحة', 25.2854, 51.5310],
  ['Al Rayyan', 'الريان', 25.2919, 51.4244],
  ['Al Wakrah', 'الوكرة', 25.1659, 51.5979],
]);

const BAHRAIN_CITIES = makeCities('Bahrain', 'البحرين', 3, [
  ['Manama', 'المنامة', 26.2285, 50.5860],
  ['Muharraq', 'المحرق', 26.2572, 50.6119],
  ['Riffa', 'الرفاع', 26.1300, 50.5550],
]);

const OMAN_CITIES = makeCities('Oman', 'عُمان', 4, [
  ['Muscat', 'مسقط', 23.5880, 58.3829],
  ['Salalah', 'صلالة', 17.0151, 54.0924],
  ['Sohar', 'صحار', 24.3461, 56.7494],
  ['Nizwa', 'نزوى', 22.9333, 57.5333],
]);

const EGYPT_CITIES = makeCities('Egypt', 'مصر', 2, [
  ['Cairo', 'القاهرة', 30.0444, 31.2357],
  ['Alexandria', 'الإسكندرية', 31.2001, 29.9187],
  ['Giza', 'الجيزة', 30.0131, 31.2089],
  ['Aswan', 'أسوان', 24.0889, 32.8998],
  ['Luxor', 'الأقصر', 25.6872, 32.6396],
  ['Mansoura', 'المنصورة', 31.0409, 31.3785],
  ['Tanta', 'طنطا', 30.7865, 31.0004],
]);

const JORDAN_CITIES = makeCities('Jordan', 'الأردن', 3, [
  ['Amman', 'عمّان', 31.9454, 35.9284],
  ['Irbid', 'إربد', 32.5568, 35.8469],
  ['Zarqa', 'الزرقاء', 32.0728, 36.0880],
  ['Aqaba', 'العقبة', 29.5267, 35.0078],
]);

const IRAQ_CITIES = makeCities('Iraq', 'العراق', 3, [
  ['Baghdad', 'بغداد', 33.3152, 44.3661],
  ['Erbil', 'أربيل', 36.1901, 44.0091],
  ['Basra', 'البصرة', 30.5085, 47.7804],
  ['Najaf', 'النجف', 32.0003, 44.3354],
  ['Karbala', 'كربلاء', 32.6160, 44.0249],
  ['Sulaymaniyah', 'السليمانية', 35.5570, 45.4353],
  ['Mosul', 'الموصل', 36.3350, 43.1189],
]);

const PALESTINE_CITIES = makeCities('Palestine', 'فلسطين', 2, [
  ['Jerusalem', 'القدس', 31.7683, 35.2137],
  ['Gaza', 'غزة', 31.5017, 34.4668],
  ['Ramallah', 'رام الله', 31.9038, 35.2034],
  ['Hebron', 'الخليل', 31.5326, 35.0998],
  ['Nablus', 'نابلس', 32.2211, 35.2544],
  ['Bethlehem', 'بيت لحم', 31.7054, 35.2024],
]);

const LEBANON_CITIES = makeCities('Lebanon', 'لبنان', 2, [
  ['Beirut', 'بيروت', 33.8938, 35.5018],
  ['Tripoli', 'طرابلس', 34.4332, 35.8498],
  ['Sidon', 'صيدا', 33.5633, 35.3697],
]);

const SYRIA_CITIES = makeCities('Syria', 'سوريا', 3, [
  ['Damascus', 'دمشق', 33.5138, 36.2765],
  ['Aleppo', 'حلب', 36.2021, 37.1343],
  ['Homs', 'حمص', 34.7324, 36.7137],
  ['Latakia', 'اللاذقية', 35.5317, 35.7918],
]);

const YEMEN_CITIES = makeCities('Yemen', 'اليمن', 3, [
  ['Sanaa', 'صنعاء', 15.3694, 44.1910],
  ['Aden', 'عدن', 12.7855, 45.0187],
  ['Taiz', 'تعز', 13.5789, 44.0219],
]);

const SUDAN_CITIES = makeCities('Sudan', 'السودان', 2, [
  ['Khartoum', 'الخرطوم', 15.5007, 32.5599],
  ['Omdurman', 'أم درمان', 15.6445, 32.4777],
  ['Port Sudan', 'بورتسودان', 19.6158, 37.2164],
]);

const LIBYA_CITIES = makeCities('Libya', 'ليبيا', 2, [
  ['Tripoli', 'طرابلس', 32.8872, 13.1913],
  ['Benghazi', 'بنغازي', 32.1194, 20.0868],
  ['Misrata', 'مصراتة', 32.3754, 15.0925],
]);

const TUNISIA_CITIES = makeCities('Tunisia', 'تونس', 1, [
  ['Tunis', 'تونس العاصمة', 36.8065, 10.1815],
  ['Sfax', 'صفاقس', 34.7406, 10.7603],
  ['Sousse', 'سوسة', 35.8256, 10.6369],
]);

const ALGERIA_CITIES = makeCities('Algeria', 'الجزائر', 1, [
  ['Algiers', 'الجزائر العاصمة', 36.7538, 3.0588],
  ['Oran', 'وهران', 35.6969, -0.6331],
  ['Constantine', 'قسنطينة', 36.3650, 6.6147],
  ['Annaba', 'عنابة', 36.9000, 7.7667],
]);

const MOROCCO_CITIES = makeCities('Morocco', 'المغرب', 1, [
  ['Rabat', 'الرباط', 34.0209, -6.8416],
  ['Casablanca', 'الدار البيضاء', 33.5731, -7.5898],
  ['Marrakech', 'مراكش', 31.6295, -7.9811],
  ['Fes', 'فاس', 34.0181, -5.0078],
  ['Tangier', 'طنجة', 35.7595, -5.8340],
]);

const MAURITANIA_CITIES = makeCities('Mauritania', 'موريتانيا', 0, [
  ['Nouakchott', 'نواكشوط', 18.0735, -15.9582],
]);

const SOMALIA_CITIES = makeCities('Somalia', 'الصومال', 3, [
  ['Mogadishu', 'مقديشو', 2.0469, 45.3182],
  ['Hargeisa', 'هرجيسا', 9.5600, 44.0650],
]);

const DJIBOUTI_CITIES = makeCities('Djibouti', 'جيبوتي', 3, [
  ['Djibouti', 'جيبوتي', 11.5721, 43.1456],
]);

const COMOROS_CITIES = makeCities('Comoros', 'جزر القمر', 3, [
  ['Moroni', 'موروني', -11.7172, 43.2473],
]);

export const COUNTRY_GROUPS: CountryGroup[] = [
  { country: 'Saudi Arabia', countryAr: 'السعودية', cities: SAUDI_CITIES },
  { country: 'UAE', countryAr: 'الإمارات', cities: UAE_CITIES },
  { country: 'Kuwait', countryAr: 'الكويت', cities: KUWAIT_CITIES },
  { country: 'Qatar', countryAr: 'قطر', cities: QATAR_CITIES },
  { country: 'Bahrain', countryAr: 'البحرين', cities: BAHRAIN_CITIES },
  { country: 'Oman', countryAr: 'عُمان', cities: OMAN_CITIES },
  { country: 'Egypt', countryAr: 'مصر', cities: EGYPT_CITIES },
  { country: 'Jordan', countryAr: 'الأردن', cities: JORDAN_CITIES },
  { country: 'Iraq', countryAr: 'العراق', cities: IRAQ_CITIES },
  { country: 'Palestine', countryAr: 'فلسطين', cities: PALESTINE_CITIES },
  { country: 'Lebanon', countryAr: 'لبنان', cities: LEBANON_CITIES },
  { country: 'Syria', countryAr: 'سوريا', cities: SYRIA_CITIES },
  { country: 'Yemen', countryAr: 'اليمن', cities: YEMEN_CITIES },
  { country: 'Sudan', countryAr: 'السودان', cities: SUDAN_CITIES },
  { country: 'Libya', countryAr: 'ليبيا', cities: LIBYA_CITIES },
  { country: 'Tunisia', countryAr: 'تونس', cities: TUNISIA_CITIES },
  { country: 'Algeria', countryAr: 'الجزائر', cities: ALGERIA_CITIES },
  { country: 'Morocco', countryAr: 'المغرب', cities: MOROCCO_CITIES },
  { country: 'Mauritania', countryAr: 'موريتانيا', cities: MAURITANIA_CITIES },
  { country: 'Somalia', countryAr: 'الصومال', cities: SOMALIA_CITIES },
  { country: 'Djibouti', countryAr: 'جيبوتي', cities: DJIBOUTI_CITIES },
  { country: 'Comoros', countryAr: 'جزر القمر', cities: COMOROS_CITIES },
];

export const ALL_CITIES: City[] = COUNTRY_GROUPS.flatMap(g => g.cities);

export const CITIES = ALL_CITIES;

export const DEFAULT_CITY = SAUDI_CITIES[0];
