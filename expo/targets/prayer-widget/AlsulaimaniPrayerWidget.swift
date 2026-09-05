import SwiftUI
import UIKit
import WidgetKit

private let appGroup = "group.app.alsulaimani.athan"
private let widgetKind = "AlsulaimaniPrayerWidget"

private struct SharedPrayer: Codable {
    let name: String
    let label: String?
    let labelAr: String
    let time: Double
    let timeText: String
}

private struct PrayerEntry: TimelineEntry {
    let date: Date
    let locationNameAr: String
    let locationNameEn: String
    let appLanguage: String?
    let alwaysLocationEnabled: Bool
    let prayer: SharedPrayer?
    let isPlaceholder: Bool
}

private struct SharedState {
    let locationNameAr: String
    let locationNameEn: String
    let appLanguage: String?
    let alwaysLocationEnabled: Bool
    let prayers: [SharedPrayer]
}

private struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerEntry {
        PrayerEntry(
            date: Date(),
            locationNameAr: "موقعك الحالي",
            locationNameEn: "Current location",
            appLanguage: nil,
            alwaysLocationEnabled: false,
            prayer: SharedPrayer(
                name: "asr",
                label: "Asr",
                labelAr: "العصر",
                time: Date().addingTimeInterval(3600).timeIntervalSince1970,
                timeText: "3:41 PM"
            ),
            isPlaceholder: true
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        if context.isPreview {
            completion(placeholder(in: context))
            return
        }
        completion(makeEntries().first ?? fallbackEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let entries = makeEntries()
        let refreshDate: Date

        if let lastPrayerTime = entries.last?.prayer?.time {
            refreshDate = max(
                Date().addingTimeInterval(60),
                Date(timeIntervalSince1970: lastPrayerTime).addingTimeInterval(60)
            )
        } else {
            refreshDate = Date().addingTimeInterval(15 * 60)
        }

        completion(Timeline(entries: entries, policy: .after(refreshDate)))
    }

    private func makeEntries() -> [PrayerEntry] {
        let state = loadState()
        let prayers = Array(state.prayers.prefix(50))

        guard !prayers.isEmpty else {
            return [PrayerEntry(
                date: Date(),
                locationNameAr: state.locationNameAr,
                locationNameEn: state.locationNameEn,
                appLanguage: state.appLanguage,
                alwaysLocationEnabled: state.alwaysLocationEnabled,
                prayer: nil,
                isPlaceholder: false
            )]
        }

        return prayers.enumerated().map { index, prayer in
            let entryDate: Date
            if index == 0 {
                entryDate = Date()
            } else {
                entryDate = Date(timeIntervalSince1970: prayers[index - 1].time + 1)
            }

            return PrayerEntry(
                date: entryDate,
                locationNameAr: state.locationNameAr,
                locationNameEn: state.locationNameEn,
                appLanguage: state.appLanguage,
                alwaysLocationEnabled: state.alwaysLocationEnabled,
                prayer: prayer,
                isPlaceholder: false
            )
        }
    }

    private func loadState() -> SharedState {
        let defaults = UserDefaults(suiteName: appGroup)
        let legacyLocationName = defaults?.string(forKey: "locationName") ?? "موقعك الحالي"
        let locationNameAr = defaults?.string(forKey: "locationNameAr") ?? legacyLocationName
        let locationNameEn = defaults?.string(forKey: "locationNameEn") ?? legacyLocationName
        let appLanguage = defaults?.string(forKey: "appLanguage")
        let alwaysLocationEnabled = defaults?.integer(forKey: "alwaysLocationEnabled") == 1
        let now = Date().timeIntervalSince1970
        var prayers: [SharedPrayer] = []

        if defaults?.integer(forKey: "widgetDataReady") == 1,
           let scheduleData = defaults?.data(forKey: "prayerSchedule"),
           let decodedSchedule = try? JSONDecoder().decode([SharedPrayer].self, from: scheduleData) {
            prayers = decodedSchedule
                .filter { $0.time > now }
                .sorted { $0.time < $1.time }
        }

        // Backward-compatible fallback for users upgrading from older builds.
        if prayers.isEmpty,
           defaults?.integer(forKey: "widgetDataReady") == 1,
           let name = defaults?.string(forKey: "nextPrayerName"),
           let labelAr = defaults?.string(forKey: "nextPrayerLabelAr"),
           let timeText = defaults?.string(forKey: "nextPrayerTimeText"),
           let storedTime = defaults?.object(forKey: "nextPrayerTime") as? NSNumber,
           storedTime.doubleValue > now {
            prayers = [SharedPrayer(
                name: name,
                label: nil,
                labelAr: labelAr,
                time: storedTime.doubleValue,
                timeText: timeText
            )]
        }

        return SharedState(
            locationNameAr: locationNameAr,
            locationNameEn: locationNameEn,
            appLanguage: appLanguage,
            alwaysLocationEnabled: alwaysLocationEnabled,
            prayers: prayers
        )
    }

    private func fallbackEntry() -> PrayerEntry {
        PrayerEntry(
            date: Date(),
            locationNameAr: "موقعك الحالي",
            locationNameEn: "Current location",
            appLanguage: nil,
            alwaysLocationEnabled: false,
            prayer: nil,
            isPlaceholder: false
        )
    }
}

private struct WidgetBackgroundModifier: ViewModifier {
    let family: WidgetFamily
    let showsImage: Bool

    func body(content: Content) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(for: .widget) {
                WidgetBackground(family: family, showsImage: showsImage)
            }
        } else {
            content.background {
                WidgetBackground(family: family, showsImage: showsImage)
            }
        }
    }
}

private struct WidgetBackground: View {
    let family: WidgetFamily
    let showsImage: Bool

    // Widget extensions have a strict memory budget. Decode the original app
    // background once into a widget-sized bitmap instead of retaining the
    // full-resolution phone artwork in every timeline render.
    private static let thumbnail: UIImage? = {
        guard let source = UIImage(named: "widgetBackground") else { return nil }
        return source.preparingThumbnail(of: CGSize(width: 700, height: 700))
    }()

    var body: some View {
        ZStack {
            Color(red: 11.0/255.0, green: 26.0/255.0, blue: 31.0/255.0)

            if showsImage, let image = Self.thumbnail {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .scaleEffect(family == .systemMedium ? 1.08 : 1.0)
                    .offset(y: family == .systemMedium ? 30 : 5)
            }

            LinearGradient(
                colors: [
                    Color(red: 6.0/255.0, green: 18.0/255.0, blue: 24.0/255.0).opacity(0.62),
                    Color.black.opacity(0.76),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        .clipped()
    }
}

private struct PrayerWidgetView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection
    let entry: PrayerEntry

    private let gold = Color(red: 201.0/255.0, green: 168.0/255.0, blue: 76.0/255.0)
    private let lightGold = Color(red: 226.0/255.0, green: 198.0/255.0, blue: 106.0/255.0)

    private var isArabic: Bool {
        entry.appLanguage.map { $0 == "ar" } ?? locale.identifier.hasPrefix("ar")
    }

    private var locationName: String {
        isArabic ? entry.locationNameAr : entry.locationNameEn
    }

    private func prayerLabel(_ prayer: SharedPrayer) -> String {
        if prayer.name == "dhuhr" {
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = .autoupdatingCurrent
            let prayerDate = Date(timeIntervalSince1970: prayer.time)
            if calendar.component(.weekday, from: prayerDate) == 6 {
                return isArabic ? "صلاة الجمعة" : "Jumu'ah Prayer"
            }
        }

        guard !isArabic else { return prayer.labelAr }
        if let label = prayer.label, !label.isEmpty { return label }
        switch prayer.name {
        case "fajr": return "Fajr"
        case "dhuhr": return "Dhuhr"
        case "asr": return "Asr"
        case "maghrib": return "Maghrib"
        case "isha": return "Isha"
        default: return prayer.labelAr
        }
    }

    private var refreshLabel: String {
        isArabic ? "تحديث الموقع" : "Refresh location"
    }

    var body: some View {
        Group {
            if family == .systemSmall {
                smallWidget
            } else {
                mediumWidget
            }
        }
        .padding(14)
        .modifier(WidgetBackgroundModifier(family: family, showsImage: !entry.isPlaceholder))
    }

    private var locationHeader: some View {
        HStack(spacing: 5) {
            Image(systemName: "location.fill")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(gold)
                .accessibilityHidden(true)

            Text(locationName)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.92))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
                .layoutPriority(1)
        }
    }

    private var smallWidget: some View {
        VStack(spacing: 5) {
            HStack {
                Spacer(minLength: 0)

                if entry.alwaysLocationEnabled {
                    Text(locationName)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.92))
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                        .allowsTightening(true)
                        .truncationMode(.tail)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, minHeight: 30, alignment: .center)
                        .accessibilityLabel(
                            isArabic
                                ? "موقع المواقيت: \(locationName)"
                                : "Prayer location: \(locationName)"
                        )
                } else {
                    Link(destination: URL(string: "alsulaimani-athan://refresh-location")!) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(lightGold)
                            .frame(width: 30, height: 30)
                            .background(gold.opacity(0.16), in: Circle())
                    }
                    .accessibilityLabel(refreshLabel)
                }

                Spacer(minLength: 0)
            }

            Divider().overlay(gold.opacity(0.30))

            Spacer(minLength: 0)

            if let prayer = entry.prayer {
                Text(prayerLabel(prayer))
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.68)
                    .frame(maxWidth: .infinity, alignment: .center)

                Text(prayer.timeText)
                    .font(.system(size: 20, weight: .semibold, design: .rounded))
                    .foregroundStyle(lightGold)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                Text(isArabic ? "افتح التطبيق لتحديث المواقيت" : "Open the app to refresh prayer times")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, alignment: .center)
            }

            Spacer(minLength: 0)
        }
    }

    private var mediumWidget: some View {
        VStack(alignment: layoutDirection == .rightToLeft ? .trailing : .leading, spacing: 8) {
            HStack {
                locationHeader
                Spacer(minLength: 0)
            }

            Divider().overlay(gold.opacity(0.30))

            if let prayer = entry.prayer {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: layoutDirection == .rightToLeft ? .trailing : .leading, spacing: 1) {
                        Text(isArabic ? "الصلاة القادمة" : "Next prayer")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.76))
                        Text(prayerLabel(prayer))
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    Text(prayer.timeText)
                        .font(.system(size: 22, weight: .semibold, design: .rounded))
                        .foregroundStyle(lightGold)
                        .lineLimit(1)
                }
            } else {
                Text(isArabic ? "افتح التطبيق لتحديث المواقيت" : "Open the app to refresh prayer times")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: layoutDirection == .rightToLeft ? .trailing : .leading)
            }

            Spacer(minLength: 0)

            if !entry.alwaysLocationEnabled {
                Link(destination: URL(string: "alsulaimani-athan://refresh-location")!) {
                    Label(refreshLabel, systemImage: "location.circle.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(lightGold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                        .background(gold.opacity(0.16), in: RoundedRectangle(cornerRadius: 10))
                }
                .accessibilityLabel(refreshLabel)
            }
        }
    }
}

@main
struct AlsulaimaniPrayerWidget: Widget {
    let kind: String = widgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            PrayerWidgetView(entry: entry)
        }
        .configurationDisplayName("الصلاة القادمة")
        .description("يعرض الصلاة القادمة وموقع المواقيت مع اختصار لتحديث الموقع.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
