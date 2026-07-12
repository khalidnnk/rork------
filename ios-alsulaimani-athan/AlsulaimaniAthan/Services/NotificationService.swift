import Foundation
import UserNotifications
import UIKit

final class NotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationService()
    private let center = UNUserNotificationCenter.current()

    private override init() {
        super.init()
        center.delegate = self
    }

    func requestPermission() async -> Bool {
        let settings = await center.notificationSettings()
        if settings.authorizationStatus == .authorized { return true }
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound])
            return granted
        } catch {
            print("[NotificationService] Permission error: \(error)")
            return false
        }
    }

    func setupCategories() {
        let openAction = UNNotificationAction(
            identifier: "OPEN_ATHAN",
            title: "استمع للأذان كاملاً",
            options: [.foreground]
        )
        let fullCategory = UNNotificationCategory(
            identifier: "athan_full",
            actions: [openAction],
            intentIdentifiers: [],
            options: []
        )
        let hayaCategory = UNNotificationCategory(
            identifier: "athan_haya",
            actions: [UNNotificationAction(identifier: "OPEN_ATHAN", title: "فتح التطبيق", options: [.foreground])],
            intentIdentifiers: [],
            options: []
        )
        let akbarCategory = UNNotificationCategory(
            identifier: "athan_akbar",
            actions: [UNNotificationAction(identifier: "OPEN_ATHAN", title: "فتح التطبيق", options: [.foreground])],
            intentIdentifiers: [],
            options: []
        )
        let defaultCategory = UNNotificationCategory(
            identifier: "athan_default",
            actions: [],
            intentIdentifiers: [],
            options: []
        )
        center.setNotificationCategories([fullCategory, hayaCategory, akbarCategory, defaultCategory])
    }

    func scheduleAllNotifications(
        prayers: [PrayerTime],
        enabledPrayers: [PrayerName: Bool],
        soundType: NotificationSoundType,
        offsets: [PrayerName: Int]
    ) {
        cancelAll()

        var scheduled = 0
        for prayer in prayers {
            if enabledPrayers[prayer.name] == true {
                if schedule(prayer: prayer, soundType: soundType) { scheduled += 1 }
            }
        }

        if scheduled == 0 {
            scheduleTomorrow(enabledPrayers: enabledPrayers, soundType: soundType, offsets: offsets)
        }
    }

    private func schedule(prayer: PrayerTime, soundType: NotificationSoundType) -> Bool {
        guard prayer.time > Date() else { return false }

        let content = UNMutableNotificationContent()
        content.title = "حان وقت صلاة \(prayer.labelAr)"
        if soundType == .fullAthan {
            content.body = "\(prayer.label) - \(prayer.timeStr) | افتح للاستماع للأذان كاملاً"
        } else {
            content.body = "\(prayer.label) - \(prayer.timeStr)"
        }
        content.sound = soundForNotification(soundType: soundType)
        content.userInfo = ["prayerName": prayer.name.rawValue, "time": prayer.timeStr, "soundType": soundType.rawValue]
        content.categoryIdentifier = categoryIdentifier(for: soundType)
        content.interruptionLevel = .active

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: prayer.time)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(identifier: "athan-\(prayer.name.rawValue)-\(prayer.time.timeIntervalSince1970)", content: content, trigger: trigger)

        center.add(request)
        return true
    }

    private func scheduleTomorrow(enabledPrayers: [PrayerName: Bool], soundType: NotificationSoundType, offsets: [PrayerName: Int]) {
        let tomorrow = Date().addingTimeInterval(86400)
        let calc = PrayerTimeCalculator()
        let systemTz = getTimezoneOffset()
        let prayers = calc.calculatePrayerTimes(date: tomorrow, latitude: 24.7136, longitude: 46.6753, timezone: systemTz, offsets: offsets).prayers
        for prayer in prayers {
            if enabledPrayers[prayer.name] == true {
                schedule(prayer: prayer, soundType: soundType)
            }
        }
    }

    private func soundForNotification(soundType: NotificationSoundType) -> UNNotificationSound? {
        switch soundType {
        case .athan:
            return UNNotificationSound(named: UNNotificationSoundName("haya-ala-salah.m4a"))
        case .fullAthan:
            return UNNotificationSound(named: UNNotificationSoundName("athan.m4a"))
        case .allahuAkbar:
            return UNNotificationSound(named: UNNotificationSoundName("allahu-akbar.m4a"))
        case .default:
            return .default
        case .silent:
            return nil
        }
    }

    private func categoryIdentifier(for soundType: NotificationSoundType) -> String {
        switch soundType {
        case .athan: return "athan_haya"
        case .fullAthan: return "athan_full"
        case .allahuAkbar: return "athan_akbar"
        default: return "athan_default"
        }
    }

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
    }

    // Foreground notification handling
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        if let nameRaw = userInfo["prayerName"] as? String,
           let name = PrayerName(rawValue: nameRaw),
           let soundRaw = userInfo["soundType"] as? String,
           let soundType = NotificationSoundType(rawValue: soundRaw) {
            NotificationCenter.default.post(
                name: .init("AthanNotificationTapped"),
                object: nil,
                userInfo: ["prayerName": name, "soundType": soundType, "action": response.actionIdentifier]
            )
        }
        completionHandler()
    }
}
