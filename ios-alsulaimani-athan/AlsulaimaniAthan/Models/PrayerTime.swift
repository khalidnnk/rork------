import Foundation

enum PrayerName: String, Codable, CaseIterable, Identifiable {
    case fajr
    case dhuhr
    case asr
    case maghrib
    case isha

    var id: String { rawValue }

    var label: String {
        switch self {
        case .fajr: return "Fajr"
        case .dhuhr: return "Dhuhr"
        case .asr: return "Asr"
        case .maghrib: return "Maghrib"
        case .isha: return "Isha"
        }
    }

    var labelAr: String {
        switch self {
        case .fajr: return "الفجر"
        case .dhuhr: return "الظهر"
        case .asr: return "العصر"
        case .maghrib: return "المغرب"
        case .isha: return "العشاء"
        }
    }

    var iconName: String {
        switch self {
        case .fajr: return "sunrise"
        case .dhuhr: return "sun.max"
        case .asr: return "cloud.sun"
        case .maghrib: return "sunset"
        case .isha: return "moon"
        }
    }
}

struct PrayerTime: Identifiable, Codable, Hashable {
    let id = UUID()
    let name: PrayerName
    let time: Date
    let timeStr: String

    var label: String { name.label }
    var labelAr: String { name.labelAr }

    init(name: PrayerName, time: Date) {
        self.name = name
        self.time = time
        self.timeStr = formatTime(time)
    }
}

struct DailyPrayers: Identifiable, Codable {
    let id = UUID()
    let date: Date
    let prayers: [PrayerTime]
}

struct NextPrayerResult {
    let prayer: PrayerTime
    let isTomorrow: Bool
}
