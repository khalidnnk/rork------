import Foundation

extension Date {
    var arabicDateString: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ar_SA")
        formatter.dateFormat = "EEEE، d MMMM yyyy"
        return formatter.string(from: self)
    }
}

extension DateComponents {
    static func timeUntil(target: Date) -> (hours: Int, minutes: Int, seconds: Int, totalSeconds: Int) {
        let now = Date()
        let diff = max(0, target.timeIntervalSince(now))
        let totalSeconds = Int(diff)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        return (hours, minutes, seconds, totalSeconds)
    }
}

func hoursToDate(_ hours: Double, baseDate: Date) -> Date {
    let h = Int(hours)
    let minFloat = (hours - Double(h)) * 60
    let m = Int(minFloat)
    let s = Int((minFloat - Double(m)) * 60)
    var calendar = Calendar.current
    calendar.timeZone = TimeZone.current
    var components = calendar.dateComponents([.year, .month, .day], from: baseDate)
    components.hour = h
    components.minute = m
    components.second = s
    return calendar.date(from: components) ?? baseDate
}

func formatTime(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US")
    formatter.dateFormat = "h:mm a"
    return formatter.string(from: date)
}

func getTimezoneOffset() -> Double {
    return -Double(TimeZone.current.secondsFromGMT()) / 3600.0
}
