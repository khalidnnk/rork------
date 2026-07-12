import Foundation

final class PrayerTimeCalculator {
    private let degToRad = Double.pi / 180
    private let radToDeg = 180 / Double.pi

    func calculatePrayerTimes(
        date: Date,
        latitude: Double,
        longitude: Double,
        timezone: Double,
        offsets: [PrayerName: Int] = [:]
    ) -> DailyPrayers {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        let year = components.year ?? 2024
        let month = components.month ?? 1
        let day = components.day ?? 1
        let jd = julianDate(year: year, month: month, day: day)

        let fajrAngle = -18.5
        let sunriseAngle = -0.833
        let asrFactor = 1.0
        let isRamadanNow = isRamadan(date)
        let ishaMinutes = isRamadanNow ? 120.0 : 90.0

        let fajrHours = sunAngleTime(jd: jd, angle: fajrAngle, lat: latitude, tz: timezone, lng: longitude, direction: .ccw)
        let dhuhrHours = midDay(jd: jd, tz: timezone, lng: longitude) + 1 / 60
        let asrHours = asrTime(jd: jd, factor: asrFactor, lat: latitude, tz: timezone, lng: longitude)
        let maghribHours = sunAngleTime(jd: jd, angle: sunriseAngle, lat: latitude, tz: timezone, lng: longitude, direction: .cw)
        let ishaHours = maghribHours + ishaMinutes / 60

        let baseDate = calendar.date(from: components) ?? date

        let prayers: [PrayerTime] = [
            PrayerTime(name: .fajr, time: hoursToDate(fajrHours + Double(offsets[.fajr] ?? 0) / 60, baseDate: baseDate)),
            PrayerTime(name: .dhuhr, time: hoursToDate(dhuhrHours + Double(offsets[.dhuhr] ?? 0) / 60, baseDate: baseDate)),
            PrayerTime(name: .asr, time: hoursToDate(asrHours + Double(offsets[.asr] ?? 0) / 60, baseDate: baseDate)),
            PrayerTime(name: .maghrib, time: hoursToDate(maghribHours + Double(offsets[.maghrib] ?? 0) / 60, baseDate: baseDate)),
            PrayerTime(name: .isha, time: hoursToDate(ishaHours + Double(offsets[.isha] ?? 0) / 60, baseDate: baseDate))
        ]

        return DailyPrayers(date: baseDate, prayers: prayers)
    }

    func getNextPrayer(prayers: [PrayerTime], now: Date = Date()) -> PrayerTime? {
        for prayer in prayers {
            if prayer.time > now {
                return prayer
            }
        }
        return nil
    }

    func getNextPrayerWithTomorrow(
        todayPrayers: [PrayerTime],
        latitude: Double,
        longitude: Double,
        timezone: Double,
        offsets: [PrayerName: Int]
    ) -> NextPrayerResult? {
        let now = Date()
        if let todayNext = getNextPrayer(prayers: todayPrayers, now: now) {
            return NextPrayerResult(prayer: todayNext, isTomorrow: false)
        }

        let tomorrow = now.addingTimeInterval(86400)
        let tomorrowPrayers = calculatePrayerTimes(date: tomorrow, latitude: latitude, longitude: longitude, timezone: timezone, offsets: offsets)
        if let first = tomorrowPrayers.prayers.first {
            return NextPrayerResult(prayer: first, isTomorrow: true)
        }
        return nil
    }

    // MARK: - Private math

    private func sin(_ deg: Double) -> Double { return Foundation.sin(deg * degToRad) }
    private func cos(_ deg: Double) -> Double { return Foundation.cos(deg * degToRad) }
    private func tan(_ deg: Double) -> Double { return Foundation.tan(deg * degToRad) }
    private func arcsin(_ x: Double) -> Double { return Foundation.asin(x) * radToDeg }
    private func arccos(_ x: Double) -> Double { return Foundation.acos(x) * radToDeg }
    private func arctan2(_ y: Double, _ x: Double) -> Double { return Foundation.atan2(y, x) * radToDeg }

    private func fixAngle(_ a: Double) -> Double { return a - 360 * floor(a / 360) }
    private func fixHour(_ h: Double) -> Double { return h - 24 * floor(h / 24) }

    private func julianDate(year: Int, month: Int, day: Int) -> Double {
        var y = year
        var m = month
        if m <= 2 {
            y -= 1
            m += 12
        }
        let a = Int(floor(Double(y) / 100))
        let b = 2 - a + Int(floor(Double(a) / 4))
        return floor(365.25 * Double(y + 4716)) + floor(30.6001 * Double(m + 1)) + Double(day) + Double(b) - 1524.5
    }

    private func sunPosition(jd: Double) -> (declination: Double, equation: Double) {
        let d = jd - 2451545.0
        let g = fixAngle(357.529 + 0.98560028 * d)
        let q = fixAngle(280.459 + 0.98564736 * d)
        let l = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g))
        let e = 23.439 - 0.00000036 * d
        let ra = arctan2(cos(e) * sin(l), cos(l)) / 15
        let decl = arcsin(sin(e) * sin(l))
        let eqt = q / 15 - fixHour(ra)
        return (decl, eqt)
    }

    private func midDay(jd: Double, tz: Double, lng: Double) -> Double {
        let sp = sunPosition(jd: jd)
        let noon = fixHour(12 - sp.equation)
        return noon + (tz - lng / 15)
    }

    private enum Direction { case ccw, cw }

    private func sunAngleTime(jd: Double, angle: Double, lat: Double, tz: Double, lng: Double, direction: Direction) -> Double {
        let sp = sunPosition(jd: jd)
        let noon = midDay(jd: jd, tz: tz, lng: lng)
        let decl = sp.declination
        let cosHA = (sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl))
        if cosHA < -1 || cosHA > 1 { return .nan }
        let ha = arccos(cosHA) / 15
        return noon + (direction == .ccw ? -ha : ha)
    }

    private func asrTime(jd: Double, factor: Double, lat: Double, tz: Double, lng: Double) -> Double {
        let sp = sunPosition(jd: jd)
        let decl = sp.declination
        let noon = midDay(jd: jd, tz: tz, lng: lng)
        let angle = arctan2(1, factor + tan(abs(lat - decl)))
        let cosHA = (sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl))
        if cosHA < -1 || cosHA > 1 { return .nan }
        let ha = arccos(cosHA) / 15
        return noon + ha
    }

    private func isRamadan(_ date: Date) -> Bool {
        var calendar = Calendar(identifier: .islamicUmmAlQura)
        calendar.locale = Locale(identifier: "en_US")
        let components = calendar.dateComponents([.month], from: date)
        return components.month == 9
    }
}
