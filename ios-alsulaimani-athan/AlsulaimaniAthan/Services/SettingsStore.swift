import Foundation

final class SettingsStore {
    static let shared = SettingsStore()
    private let key = "athan_settings_v3"

    private init() {}

    func load() -> AthanSettings {
        guard let data = UserDefaults.standard.data(forKey: key),
              let settings = try? JSONDecoder().decode(AthanSettings.self, from: data) else {
            return .default
        }
        return settings
    }

    func save(_ settings: AthanSettings) {
        if let data = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
