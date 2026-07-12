import Foundation

enum NotificationSoundType: String, Codable, CaseIterable, Identifiable {
    case athan
    case fullAthan = "full_athan"
    case allahuAkbar = "allahu_akbar"
    case `default`
    case silent

    var id: String { rawValue }

    var label: String {
        switch self {
        case .athan: return "حي على الصلاة"
        case .fullAthan: return "الأذان كاملاً"
        case .allahuAkbar: return "الله أكبر"
        case .default: return "صوت النظام"
        case .silent: return "صامت"
        }
    }

    var description: String {
        switch self {
        case .athan: return "مقطع قصير من الأذان"
        case .fullAthan: return "٣٠ ثانية في التنبيه ويكمل داخل التطبيق"
        case .allahuAkbar: return "تكبيرة تنبيه"
        case .default: return "نغمة التنبيه الافتراضية"
        case .silent: return "بدون صوت"
        }
    }

    var fileName: String? {
        switch self {
        case .athan: return "haya-ala-salah.m4a"
        case .fullAthan: return "athan.m4a"
        case .allahuAkbar: return "allahu-akbar.m4a"
        case .default, .silent: return nil
        }
    }
}

enum LocationMode: String, Codable {
    case auto
    case manual
}

struct AthanSettings: Codable {
    var globalEnabled: Bool
    var enabledPrayers: [PrayerName: Bool]
    var offsets: [PrayerName: Int]
    var locationName: String
    var latitude: Double
    var longitude: Double
    var timezone: Double
    var locationMode: LocationMode
    var hasSeenWelcome: Bool
    var hasSeenLocationOnboarding: Bool
    var notificationSound: NotificationSoundType

    static var `default`: AthanSettings {
        AthanSettings(
            globalEnabled: true,
            enabledPrayers: [
                .fajr: true,
                .dhuhr: true,
                .asr: true,
                .maghrib: true,
                .isha: true
            ],
            offsets: [
                .fajr: 0,
                .dhuhr: 0,
                .asr: 0,
                .maghrib: 0,
                .isha: 0
            ],
            locationName: "الرياض",
            latitude: 24.7136,
            longitude: 46.6753,
            timezone: 3,
            locationMode: .auto,
            hasSeenWelcome: false,
            hasSeenLocationOnboarding: false,
            notificationSound: .athan
        )
    }
}
