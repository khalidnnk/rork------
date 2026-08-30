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
    let locationName: String
    let prayer: SharedPrayer?
}

private struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerEntry {
        PrayerEntry(
            date: Date(),
            locationName: "موقعك الحالي",
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
        let locationName = defaults?.string(forKey: "locationName") ?? "موقعك الحالي"
        let prayersJSON = defaults?.string(forKey: "prayersJSON") ?? "[]"
        let prayers = (try? JSONDecoder().decode([SharedPrayer].self, from: Data(prayersJSON.utf8))) ?? []
        let now = Date().timeIntervalSince1970
        let nextPrayer = prayers.first(where: { $0.time > now })
        return PrayerEntry(date: Date(), locationName: locationName, prayer: nextPrayer)
    }
}

private struct WidgetBackgroundModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(for: .widget) {
                LinearGradient(
                    colors: [Color(red: 15.0/255.0, green: 34.0/255.0, blue: 41.0/255.0), Color(red: 11.0/255.0, green: 26.0/255.0, blue: 31.0/255.0)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        } else {
            content.background(
                LinearGradient(
                    colors: [Color(red: 15.0/255.0, green: 34.0/255.0, blue: 41.0/255.0), Color(red: 11.0/255.0, green: 26.0/255.0, blue: 31.0/255.0)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        }
    }
}

private struct PrayerWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: PrayerEntry

    private let gold = Color(red: 201.0/255.0, green: 168.0/255.0, blue: 76.0/255.0)
    private let lightGold = Color(red: 226.0/255.0, green: 198.0/255.0, blue: 106.0/255.0)

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            HStack(spacing: 7) {
                Spacer(minLength: 0)
                Text(entry.locationName)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white.opacity(0.86))
                    .lineLimit(1)
                Image(systemName: "location.fill")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(gold)
            }

            Divider().overlay(gold.opacity(0.25))

            if let prayer = entry.prayer {
                HStack(alignment: .firstTextBaseline) {
                    Text(prayer.timeText)
                        .font(.system(size: family == .systemSmall ? 17 : 22, weight: .semibold, design: .rounded))
                        .foregroundStyle(lightGold)
                        .lineLimit(1)
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        Text("الصلاة القادمة")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.7))
                        Text(prayer.labelAr)
                            .font(.system(size: family == .systemSmall ? 22 : 26, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
            } else {
                Text("افتح التطبيق لتحديث المواقيت")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }

            Spacer(minLength: 0)

            Link(destination: URL(string: "alsulaimani-athan://refresh-location")!) {
                Label("تحديث الموقع", systemImage: "location.circle.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(lightGold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
                    .background(gold.opacity(0.14), in: RoundedRectangle(cornerRadius: 10))
            }
            .accessibilityLabel("فتح التطبيق وتحديث الموقع")
        }
        .environment(\.layoutDirection, .rightToLeft)
        .padding(14)
        .modifier(WidgetBackgroundModifier())
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
