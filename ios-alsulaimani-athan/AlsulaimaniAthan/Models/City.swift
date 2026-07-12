import Foundation

struct City: Identifiable, Hashable, Codable {
    let id = UUID()
    let name: String
    let nameAr: String
    let latitude: Double
    let longitude: Double
    let timezone: Double
    let country: String
    let countryAr: String
}

struct CountryGroup: Identifiable, Hashable {
    let id = UUID()
    let country: String
    let countryAr: String
    let cities: [City]
}

extension City {
    static let defaultCity = City(
        name: "Riyadh",
        nameAr: "الرياض",
        latitude: 24.7136,
        longitude: 46.6753,
        timezone: 3,
        country: "Saudi Arabia",
        countryAr: "السعودية"
    )
}

extension CountryGroup {
    static let all: [CountryGroup] = [
        CountryGroup(country: "Saudi Arabia", countryAr: "السعودية", cities: [
            City(name: "Riyadh", nameAr: "الرياض", latitude: 24.7136, longitude: 46.6753, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Makkah", nameAr: "مكة المكرمة", latitude: 21.4225, longitude: 39.8262, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Madinah", nameAr: "المدينة المنورة", latitude: 24.4672, longitude: 39.6024, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Jeddah", nameAr: "جدة", latitude: 21.4858, longitude: 39.1925, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Dammam", nameAr: "الدمام", latitude: 26.3927, longitude: 49.9777, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Tabuk", nameAr: "تبوك", latitude: 28.3838, longitude: 36.5550, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Abha", nameAr: "أبها", latitude: 18.2164, longitude: 42.5053, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Qassim", nameAr: "القصيم", latitude: 26.3260, longitude: 43.9750, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Hail", nameAr: "حائل", latitude: 27.5114, longitude: 41.7208, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Jizan", nameAr: "جازان", latitude: 16.8892, longitude: 42.5611, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Najran", nameAr: "نجران", latitude: 17.4933, longitude: 44.1277, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Al Khobar", nameAr: "الخبر", latitude: 26.2172, longitude: 50.1971, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Taif", nameAr: "الطائف", latitude: 21.2703, longitude: 40.4158, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Yanbu", nameAr: "ينبع", latitude: 24.0895, longitude: 38.0618, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Al Ahsa", nameAr: "الأحساء", latitude: 25.3648, longitude: 49.5888, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Jubail", nameAr: "الجبيل", latitude: 27.0046, longitude: 49.6225, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Khamis Mushait", nameAr: "خميس مشيط", latitude: 18.3066, longitude: 42.7283, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
            City(name: "Al Baha", nameAr: "الباحة", latitude: 20.0000, longitude: 41.4667, timezone: 3, country: "Saudi Arabia", countryAr: "السعودية"),
        ]),
        CountryGroup(country: "UAE", countryAr: "الإمارات", cities: [
            City(name: "Dubai", nameAr: "دبي", latitude: 25.2048, longitude: 55.2708, timezone: 4, country: "UAE", countryAr: "الإمارات"),
            City(name: "Abu Dhabi", nameAr: "أبوظبي", latitude: 24.4539, longitude: 54.3773, timezone: 4, country: "UAE", countryAr: "الإمارات"),
            City(name: "Sharjah", nameAr: "الشارقة", latitude: 25.3463, longitude: 55.4209, timezone: 4, country: "UAE", countryAr: "الإمارات"),
            City(name: "Al Ain", nameAr: "العين", latitude: 24.1917, longitude: 55.7606, timezone: 4, country: "UAE", countryAr: "الإمارات"),
            City(name: "Ajman", nameAr: "عجمان", latitude: 25.4052, longitude: 55.5136, timezone: 4, country: "UAE", countryAr: "الإمارات"),
            City(name: "Ras Al Khaimah", nameAr: "رأس الخيمة", latitude: 25.7895, longitude: 55.9432, timezone: 4, country: "UAE", countryAr: "الإمارات"),
            City(name: "Fujairah", nameAr: "الفجيرة", latitude: 25.1288, longitude: 56.3265, timezone: 4, country: "UAE", countryAr: "الإمارات"),
        ]),
        CountryGroup(country: "Kuwait", countryAr: "الكويت", cities: [
            City(name: "Kuwait City", nameAr: "مدينة الكويت", latitude: 29.3759, longitude: 47.9774, timezone: 3, country: "Kuwait", countryAr: "الكويت"),
            City(name: "Ahmadi", nameAr: "الأحمدي", latitude: 29.0769, longitude: 48.0838, timezone: 3, country: "Kuwait", countryAr: "الكويت"),
            City(name: "Hawalli", nameAr: "حولي", latitude: 29.3328, longitude: 48.0286, timezone: 3, country: "Kuwait", countryAr: "الكويت"),
            City(name: "Jahra", nameAr: "الجهراء", latitude: 29.3375, longitude: 47.6581, timezone: 3, country: "Kuwait", countryAr: "الكويت"),
        ]),
        CountryGroup(country: "Qatar", countryAr: "قطر", cities: [
            City(name: "Doha", nameAr: "الدوحة", latitude: 25.2854, longitude: 51.5310, timezone: 3, country: "Qatar", countryAr: "قطر"),
            City(name: "Al Rayyan", nameAr: "الريان", latitude: 25.2919, longitude: 51.4244, timezone: 3, country: "Qatar", countryAr: "قطر"),
            City(name: "Al Wakrah", nameAr: "الوكرة", latitude: 25.1659, longitude: 51.5979, timezone: 3, country: "Qatar", countryAr: "قطر"),
        ]),
        CountryGroup(country: "Bahrain", countryAr: "البحرين", cities: [
            City(name: "Manama", nameAr: "المنامة", latitude: 26.2285, longitude: 50.5860, timezone: 3, country: "Bahrain", countryAr: "البحرين"),
            City(name: "Muharraq", nameAr: "المحرق", latitude: 26.2572, longitude: 50.6119, timezone: 3, country: "Bahrain", countryAr: "البحرين"),
            City(name: "Riffa", nameAr: "الرفاع", latitude: 26.1300, longitude: 50.5550, timezone: 3, country: "Bahrain", countryAr: "البحرين"),
        ]),
        CountryGroup(country: "Oman", countryAr: "عُمان", cities: [
            City(name: "Muscat", nameAr: "مسقط", latitude: 23.5880, longitude: 58.3829, timezone: 4, country: "Oman", countryAr: "عُمان"),
            City(name: "Salalah", nameAr: "صلالة", latitude: 17.0151, longitude: 54.0924, timezone: 4, country: "Oman", countryAr: "عُمان"),
            City(name: "Sohar", nameAr: "صحار", latitude: 24.3461, longitude: 56.7494, timezone: 4, country: "Oman", countryAr: "عُمان"),
            City(name: "Nizwa", nameAr: "نزوى", latitude: 22.9333, longitude: 57.5333, timezone: 4, country: "Oman", countryAr: "عُمان"),
        ]),
        CountryGroup(country: "Egypt", countryAr: "مصر", cities: [
            City(name: "Cairo", nameAr: "القاهرة", latitude: 30.0444, longitude: 31.2357, timezone: 2, country: "Egypt", countryAr: "مصر"),
            City(name: "Alexandria", nameAr: "الإسكندرية", latitude: 31.2001, longitude: 29.9187, timezone: 2, country: "Egypt", countryAr: "مصر"),
            City(name: "Giza", nameAr: "الجيزة", latitude: 30.0131, longitude: 31.2089, timezone: 2, country: "Egypt", countryAr: "مصر"),
            City(name: "Aswan", nameAr: "أسوان", latitude: 24.0889, longitude: 32.8998, timezone: 2, country: "Egypt", countryAr: "مصر"),
            City(name: "Luxor", nameAr: "الأقصر", latitude: 25.6872, longitude: 32.6396, timezone: 2, country: "Egypt", countryAr: "مصر"),
            City(name: "Mansoura", nameAr: "المنصورة", latitude: 31.0409, longitude: 31.3785, timezone: 2, country: "Egypt", countryAr: "مصر"),
            City(name: "Tanta", nameAr: "طنطا", latitude: 30.7865, longitude: 31.0004, timezone: 2, country: "Egypt", countryAr: "مصر"),
        ]),
        CountryGroup(country: "Jordan", countryAr: "الأردن", cities: [
            City(name: "Amman", nameAr: "عمّان", latitude: 31.9454, longitude: 35.9284, timezone: 3, country: "Jordan", countryAr: "الأردن"),
            City(name: "Irbid", nameAr: "إربد", latitude: 32.5568, longitude: 35.8469, timezone: 3, country: "Jordan", countryAr: "الأردن"),
            City(name: "Zarqa", nameAr: "الزرقاء", latitude: 32.0728, longitude: 36.0880, timezone: 3, country: "Jordan", countryAr: "الأردن"),
            City(name: "Aqaba", nameAr: "العقبة", latitude: 29.5267, longitude: 35.0078, timezone: 3, country: "Jordan", countryAr: "الأردن"),
        ]),
        CountryGroup(country: "Iraq", countryAr: "العراق", cities: [
            City(name: "Baghdad", nameAr: "بغداد", latitude: 33.3152, longitude: 44.3661, timezone: 3, country: "Iraq", countryAr: "العراق"),
            City(name: "Erbil", nameAr: "أربيل", latitude: 36.1901, longitude: 44.0091, timezone: 3, country: "Iraq", countryAr: "العراق"),
            City(name: "Basra", nameAr: "البصرة", latitude: 30.5085, longitude: 47.7804, timezone: 3, country: "Iraq", countryAr: "العراق"),
            City(name: "Najaf", nameAr: "النجف", latitude: 32.0003, longitude: 44.3354, timezone: 3, country: "Iraq", countryAr: "العراق"),
            City(name: "Karbala", nameAr: "كربلاء", latitude: 32.6160, longitude: 44.0249, timezone: 3, country: "Iraq", countryAr: "العراق"),
            City(name: "Sulaymaniyah", nameAr: "السليمانية", latitude: 35.5570, longitude: 45.4353, timezone: 3, country: "Iraq", countryAr: "العراق"),
            City(name: "Mosul", nameAr: "الموصل", latitude: 36.3350, longitude: 43.1189, timezone: 3, country: "Iraq", countryAr: "العراق"),
        ]),
        CountryGroup(country: "Palestine", countryAr: "فلسطين", cities: [
            City(name: "Jerusalem", nameAr: "القدس", latitude: 31.7683, longitude: 35.2137, timezone: 2, country: "Palestine", countryAr: "فلسطين"),
            City(name: "Gaza", nameAr: "غزة", latitude: 31.5017, longitude: 34.4668, timezone: 2, country: "Palestine", countryAr: "فلسطين"),
            City(name: "Ramallah", nameAr: "رام الله", latitude: 31.9038, longitude: 35.2034, timezone: 2, country: "Palestine", countryAr: "فلسطين"),
            City(name: "Hebron", nameAr: "الخليل", latitude: 31.5326, longitude: 35.0998, timezone: 2, country: "Palestine", countryAr: "فلسطين"),
            City(name: "Nablus", nameAr: "نابلس", latitude: 32.2211, longitude: 35.2544, timezone: 2, country: "Palestine", countryAr: "فلسطين"),
            City(name: "Bethlehem", nameAr: "بيت لحم", latitude: 31.7054, longitude: 35.2024, timezone: 2, country: "Palestine", countryAr: "فلسطين"),
        ]),
        CountryGroup(country: "Lebanon", countryAr: "لبنان", cities: [
            City(name: "Beirut", nameAr: "بيروت", latitude: 33.8938, longitude: 35.5018, timezone: 2, country: "Lebanon", countryAr: "لبنان"),
            City(name: "Tripoli", nameAr: "طرابلس", latitude: 34.4332, longitude: 35.8498, timezone: 2, country: "Lebanon", countryAr: "لبنان"),
            City(name: "Sidon", nameAr: "صيدا", latitude: 33.5633, longitude: 35.3697, timezone: 2, country: "Lebanon", countryAr: "لبنان"),
        ]),
        CountryGroup(country: "Syria", countryAr: "سوريا", cities: [
            City(name: "Damascus", nameAr: "دمشق", latitude: 33.5138, longitude: 36.2765, timezone: 3, country: "Syria", countryAr: "سوريا"),
            City(name: "Aleppo", nameAr: "حلب", latitude: 36.2021, longitude: 37.1343, timezone: 3, country: "Syria", countryAr: "سوريا"),
            City(name: "Homs", nameAr: "حمص", latitude: 34.7324, longitude: 36.7137, timezone: 3, country: "Syria", countryAr: "سوريا"),
            City(name: "Latakia", nameAr: "اللاذقية", latitude: 35.5317, longitude: 35.7918, timezone: 3, country: "Syria", countryAr: "سوريا"),
        ]),
        CountryGroup(country: "Yemen", countryAr: "اليمن", cities: [
            City(name: "Sanaa", nameAr: "صنعاء", latitude: 15.3694, longitude: 44.1910, timezone: 3, country: "Yemen", countryAr: "اليمن"),
            City(name: "Aden", nameAr: "عدن", latitude: 12.7855, longitude: 45.0187, timezone: 3, country: "Yemen", countryAr: "اليمن"),
            City(name: "Taiz", nameAr: "تعز", latitude: 13.5789, longitude: 44.0219, timezone: 3, country: "Yemen", countryAr: "اليمن"),
        ]),
        CountryGroup(country: "Sudan", countryAr: "السودان", cities: [
            City(name: "Khartoum", nameAr: "الخرطوم", latitude: 15.5007, longitude: 32.5599, timezone: 2, country: "Sudan", countryAr: "السودان"),
            City(name: "Omdurman", nameAr: "أم درمان", latitude: 15.6445, longitude: 32.4777, timezone: 2, country: "Sudan", countryAr: "السودان"),
            City(name: "Port Sudan", nameAr: "بورتسودان", latitude: 19.6158, longitude: 37.2164, timezone: 2, country: "Sudan", countryAr: "السودان"),
        ]),
        CountryGroup(country: "Libya", countryAr: "ليبيا", cities: [
            City(name: "Tripoli", nameAr: "طرابلس", latitude: 32.8872, longitude: 13.1913, timezone: 2, country: "Libya", countryAr: "ليبيا"),
            City(name: "Benghazi", nameAr: "بنغازي", latitude: 32.1194, longitude: 20.0868, timezone: 2, country: "Libya", countryAr: "ليبيا"),
            City(name: "Misrata", nameAr: "مصراتة", latitude: 32.3754, longitude: 15.0925, timezone: 2, country: "Libya", countryAr: "ليبيا"),
        ]),
        CountryGroup(country: "Tunisia", countryAr: "تونس", cities: [
            City(name: "Tunis", nameAr: "تونس العاصمة", latitude: 36.8065, longitude: 10.1815, timezone: 1, country: "Tunisia", countryAr: "تونس"),
            City(name: "Sfax", nameAr: "صفاقس", latitude: 34.7406, longitude: 10.7603, timezone: 1, country: "Tunisia", countryAr: "تونس"),
            City(name: "Sousse", nameAr: "سوسة", latitude: 35.8256, longitude: 10.6369, timezone: 1, country: "Tunisia", countryAr: "تونس"),
        ]),
        CountryGroup(country: "Algeria", countryAr: "الجزائر", cities: [
            City(name: "Algiers", nameAr: "الجزائر العاصمة", latitude: 36.7538, longitude: 3.0588, timezone: 1, country: "Algeria", countryAr: "الجزائر"),
            City(name: "Oran", nameAr: "وهران", latitude: 35.6969, longitude: -0.6331, timezone: 1, country: "Algeria", countryAr: "الجزائر"),
            City(name: "Constantine", nameAr: "قسنطينة", latitude: 36.3650, longitude: 6.6147, timezone: 1, country: "Algeria", countryAr: "الجزائر"),
            City(name: "Annaba", nameAr: "عنابة", latitude: 36.9000, longitude: 7.7667, timezone: 1, country: "Algeria", countryAr: "الجزائر"),
        ]),
        CountryGroup(country: "Morocco", countryAr: "المغرب", cities: [
            City(name: "Rabat", nameAr: "الرباط", latitude: 34.0209, longitude: -6.8416, timezone: 1, country: "Morocco", countryAr: "المغرب"),
            City(name: "Casablanca", nameAr: "الدار البيضاء", latitude: 33.5731, longitude: -7.5898, timezone: 1, country: "Morocco", countryAr: "المغرب"),
            City(name: "Marrakech", nameAr: "مراكش", latitude: 31.6295, longitude: -7.9811, timezone: 1, country: "Morocco", countryAr: "المغرب"),
            City(name: "Fes", nameAr: "فاس", latitude: 34.0181, longitude: -5.0078, timezone: 1, country: "Morocco", countryAr: "المغرب"),
            City(name: "Tangier", nameAr: "طنجة", latitude: 35.7595, longitude: -5.8340, timezone: 1, country: "Morocco", countryAr: "المغرب"),
        ]),
        CountryGroup(country: "Mauritania", countryAr: "موريتانيا", cities: [
            City(name: "Nouakchott", nameAr: "نواكشوط", latitude: 18.0735, longitude: -15.9582, timezone: 0, country: "Mauritania", countryAr: "موريتانيا"),
        ]),
        CountryGroup(country: "Somalia", countryAr: "الصومال", cities: [
            City(name: "Mogadishu", nameAr: "مقديشو", latitude: 2.0469, longitude: 45.3182, timezone: 3, country: "Somalia", countryAr: "الصومال"),
            City(name: "Hargeisa", nameAr: "هرجيسا", latitude: 9.5600, longitude: 44.0650, timezone: 3, country: "Somalia", countryAr: "الصومال"),
        ]),
        CountryGroup(country: "Djibouti", countryAr: "جيبوتي", cities: [
            City(name: "Djibouti", nameAr: "جيبوتي", latitude: 11.5721, longitude: 43.1456, timezone: 3, country: "Djibouti", countryAr: "جيبوتي"),
        ]),
        CountryGroup(country: "Comoros", countryAr: "جزر القمر", cities: [
            City(name: "Moroni", nameAr: "موروني", latitude: -11.7172, longitude: 43.2473, timezone: 3, country: "Comoros", countryAr: "جزر القمر"),
        ]),
    ]
}
