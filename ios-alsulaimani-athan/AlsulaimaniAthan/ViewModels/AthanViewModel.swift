import Foundation
import SwiftUI
import Combine
import UserNotifications
import CoreLocation

@MainActor
final class AthanViewModel: ObservableObject {
    @Published var settings: AthanSettings = .default
    @Published var dailyPrayers: DailyPrayers = DailyPrayers(date: Date(), prayers: [])
    @Published var nextPrayer: PrayerTime?
    @Published var isAdhanPlaying = false
    @Published var isPreviewPlaying = false
    @Published var previewingSoundType: NotificationSoundType?
    @Published var locationLoading = false
    @Published var countdown = (hours: 0, minutes: 0, seconds: 0, totalSeconds: 0)
    @Published var isFirstLaunch = false
    @Published var showLocationOnboarding = false

    private let calculator = PrayerTimeCalculator()
    private let store = SettingsStore.shared
    private let audio = AudioService.shared
    private let notifications = NotificationService.shared
    private let location = LocationService.shared
    private var cancellables = Set<AnyCancellable>()
    private var refreshTimer: Timer?
    private var countdownTimer: Timer?

    init() {
        loadSettings()
        recalculatePrayers()
        observeAudio()
        observeNotifications()
        startTimers()

        let loaded = store.load()
        if !loaded.hasSeenWelcome {
            isFirstLaunch = true
        }
        if !loaded.hasSeenLocationOnboarding {
            showLocationOnboarding = true
        }
    }

    private func loadSettings() {
        settings = store.load()
    }

    private func saveSettings() {
        store.save(settings)
    }

    private func startTimers() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.recalculatePrayers()
            }
        }

        countdownTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateCountdown()
            }
        }
    }

    private func observeAudio() {
        audio.$isPlaying
            .receive(on: DispatchQueue.main)
            .sink { [weak self] playing in
                self?.isAdhanPlaying = playing
                self?.isPreviewPlaying = playing && self?.previewingSoundType != nil
            }
            .store(in: &cancellables)

        audio.$currentTime
            .receive(on: DispatchQueue.main)
            .sink { _ in }
            .store(in: &cancellables)
    }

    private func observeNotifications() {
        NotificationCenter.default.addObserver(
            forName: .init("AthanNotificationTapped"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self = self,
                  let name = notification.userInfo?["prayerName"] as? PrayerName,
                  let soundType = notification.userInfo?["soundType"] as? NotificationSoundType else { return }
            if soundType == .fullAthan || soundType == .athan || soundType == .allahuAkbar {
                self.playAthanWithType(soundType, resumeFromNotification: soundType == .fullAthan)
            }
        }
    }

    func recalculatePrayers() {
        let systemTz = getTimezoneOffset()
        dailyPrayers = calculator.calculatePrayerTimes(
            date: Date(),
            latitude: settings.latitude,
            longitude: settings.longitude,
            timezone: systemTz,
            offsets: settings.offsets
        )
        updateNextPrayer()
    }

    private func updateNextPrayer() {
        let systemTz = getTimezoneOffset()
        if let result = calculator.getNextPrayerWithTomorrow(
            todayPrayers: dailyPrayers.prayers,
            latitude: settings.latitude,
            longitude: settings.longitude,
            timezone: systemTz,
            offsets: settings.offsets
        ) {
            nextPrayer = result.prayer
        } else {
            nextPrayer = nil
        }
        updateCountdown()
    }

    private func updateCountdown() {
        if let prayer = nextPrayer {
            countdown = DateComponents.timeUntil(target: prayer.time)
        } else {
            countdown = (0, 0, 0, 0)
        }
    }

    func updateSettings(_ partial: (inout AthanSettings) -> Void) {
        partial(&settings)
        saveSettings()
        recalculatePrayers()
        rescheduleNotifications()
    }

    func togglePrayer(_ name: PrayerName) {
        settings.enabledPrayers[name] = !(settings.enabledPrayers[name] ?? false)
        saveSettings()
        rescheduleNotifications()
    }

    func setOffset(_ name: PrayerName, _ offset: Int) {
        settings.offsets[name] = offset
        saveSettings()
        recalculatePrayers()
        rescheduleNotifications()
    }

    func toggleGlobal() {
        settings.globalEnabled.toggle()
        saveSettings()
        rescheduleNotifications()
    }

    func setLocation(latitude: Double, longitude: Double, name: String, timezone: Double, mode: LocationMode) {
        settings.latitude = latitude
        settings.longitude = longitude
        settings.locationName = name
        settings.timezone = timezone
        settings.locationMode = mode
        saveSettings()
        recalculatePrayers()
        rescheduleNotifications()
    }

    func dismissWelcome() {
        settings.hasSeenWelcome = true
        saveSettings()
        isFirstLaunch = false
    }

    func dismissLocationOnboarding(granted: Bool) {
        settings.hasSeenLocationOnboarding = true
        saveSettings()
        showLocationOnboarding = false
        if granted {
            detectAutoLocation()
        }
    }

    func detectAutoLocation() {
        locationLoading = true
        location.detectLocation { [weak self] result in
            Task { @MainActor in
                guard let self = self else { return }
                self.locationLoading = false
                switch result {
                case .success(let loc):
                    self.setLocation(latitude: loc.latitude, longitude: loc.longitude, name: loc.name, timezone: getTimezoneOffset(), mode: .auto)
                case .failure(let error):
                    print("[AthanViewModel] Location error: \(error)")
                }
            }
        }
    }

    func requestNotificationPermission() {
        Task {
            let _ = await notifications.requestPermission()
            notifications.setupCategories()
            rescheduleNotifications()
        }
    }

    func rescheduleNotifications() {
        guard settings.globalEnabled else {
            notifications.cancelAll()
            return
        }
        Task {
            let granted = await notifications.requestPermission()
            guard granted else { return }
            notifications.setupCategories()
            notifications.scheduleAllNotifications(
                prayers: dailyPrayers.prayers,
                enabledPrayers: settings.enabledPrayers,
                soundType: settings.notificationSound,
                offsets: settings.offsets
            )
        }
    }

    func playAthan() {
        playAthanWithType(.fullAthan, resumeFromNotification: false)
    }

    func playAthanWithType(_ soundType: NotificationSoundType, resumeFromNotification: Bool = false) {
        stopPreview()
        if resumeFromNotification && soundType == .fullAthan {
            audio.play(soundType: soundType, resumeFrom: 30)
        } else {
            audio.play(soundType: soundType)
        }
    }

    func stopAthan() {
        audio.stop()
        previewingSoundType = nil
    }

    func previewSound(_ soundType: NotificationSoundType) {
        if isPreviewPlaying && previewingSoundType == soundType {
            stopAthan()
            return
        }
        if soundType == .silent || soundType == .default { return }
        previewingSoundType = soundType
        let duration: TimeInterval = soundType == .fullAthan ? 10 : soundType == .allahuAkbar ? 30 : 8
        audio.previewSound(soundType: soundType, duration: duration)
    }

    func stopPreview() {
        audio.stop()
        previewingSoundType = nil
    }

    var currentSound: NotificationSoundType {
        settings.notificationSound
    }
}
