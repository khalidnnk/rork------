import SwiftUI
import WidgetKit

private let appGroup = "group.app.alsulaimani.athan"
private let widgetKind = "AlsulaimaniPrayerWidget"

private struct SharedPrayer: Codable {
    let name: String
    let labelAr: String
    let time: Double
    let timeText: String
}

private struct PrayerEntry: TimelineEntry {
    let date: Date
    let locationNameAr: String
    let locationNameEn: String
    let appLanguage: String?
    let prayer: SharedPrayer?
}

private struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerEntry {
        PrayerEntry(
            date: Date(),
            locationNameAr: "موقعك الحالي",
            locationNameEn: "Current location",
            appLanguage: nil,
            prayer: SharedPrayer(name: "asr", labelAr: "العصر", time: Date().addingTimeInterval(3600).timeIntervalSince1970, timeText: "3:41 PM")
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let entry = loadEntry()
        let nextRefresh = entry.prayer.map {
            min(Date(timeIntervalSince1970: $0.time).addingTimeInterval(30), Date().addingTimeInterval(15 * 60))
        } ?? Date().addingTimeInterval(15 * 60)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }

    private func loadEntry() -> PrayerEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let legacyLocationName = defaults?.string(forKey: "locationName") ?? "موقعك الحالي"
        let locationNameAr = defaults?.string(forKey: "locationNameAr") ?? legacyLocationName
        let locationNameEn = defaults?.string(forKey: "locationNameEn") ?? legacyLocationName
        let prayersJSON = defaults?.string(forKey: "prayersJSON") ?? "[]"
        let prayers = (try? JSONDecoder().decode([SharedPrayer].self, from: Data(prayersJSON.utf8))) ?? []
        let now = Date().timeIntervalSince1970
        let nextPrayer = prayers.first(where: { $0.time > now })
        let appLanguage = defaults?.string(forKey: "appLanguage")
        return PrayerEntry(date: Date(), locationNameAr: locationNameAr, locationNameEn: locationNameEn, appLanguage: appLanguage, prayer: nextPrayer)
    }
}

private struct WidgetBackgroundModifier: ViewModifier {
    let family: WidgetFamily

    func body(content: Content) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(for: .widget) {
                WidgetBackground(family: family)
            }
        } else {
            content.background {
                WidgetBackground(family: family)
            }
        }
    }
}

private struct WidgetBackground: View {
    let family: WidgetFamily

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Image("widgetBackground")
                    .resizable()
                    .scaledToFill()
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .offset(y: family == .systemMedium ? geometry.size.height * 0.30 : 0)

                LinearGradient(
                    colors: [
                        Color(red: 6.0/255.0, green: 18.0/255.0, blue: 24.0/255.0).opacity(0.58),
                        Color.black.opacity(0.72),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            }
            .clipped()
        }
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
        entry.appLanguage.map { $0 == "ar" } ?? (locale.language.languageCode?.identifier == "ar")
    }

    private var locationName: String {
        isArabic ? entry.locationNameAr : entry.locationNameEn
    }

    private func prayerLabel(_ prayer: SharedPrayer) -> String {
        guard !isArabic else { return prayer.labelAr }
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
        .modifier(WidgetBackgroundModifier(family: family))
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
            HStack(spacing: 5) {
                locationHeader

                Link(destination: URL(string: "alsulaimani-athan://refresh-location")!) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(lightGold)
                        .frame(width: 30, height: 30)
                        .background(gold.opacity(0.16), in: Circle())
                        .padding(7)
                }
                .accessibilityLabel(refreshLabel)

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
