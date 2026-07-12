import Foundation
import AVFoundation
import UIKit

final class AudioService: NSObject, ObservableObject, AVAudioPlayerDelegate {
    static let shared = AudioService()
    private var player: AVAudioPlayer?
    private var timer: Timer?
    private let athanMaxDuration: TimeInterval = 300

    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0

    private override init() {
        super.init()
        configureAudioSession()
    }

    private func configureAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[AudioService] Audio session setup error: \(error)")
        }
    }

    func play(soundType: NotificationSoundType, resumeFrom: TimeInterval? = nil) {
        guard let fileName = soundType.fileName,
              let url = Bundle.main.url(forResource: fileName, withExtension: nil) else {
            print("[AudioService] Sound file not found for \(soundType)")
            return
        }
        play(url: url, resumeFrom: resumeFrom)
    }

    func play(url: URL, resumeFrom: TimeInterval? = nil) {
        stop()
        do {
            player = try AVAudioPlayer(contentsOf: url)
            player?.delegate = self
            player?.prepareToPlay()
            player?.volume = 1.0
            duration = player?.duration ?? 0
            if let resumeFrom = resumeFrom {
                player?.currentTime = min(resumeFrom, duration)
            }
            player?.play()
            isPlaying = true
            startTimer()
        } catch {
            print("[AudioService] Play error: \(error)")
        }
    }

    func stop() {
        player?.stop()
        player = nil
        invalidateTimer()
        isPlaying = false
        currentTime = 0
        duration = 0
    }

    func pause() {
        player?.pause()
        isPlaying = false
        timer?.invalidate()
    }

    private func startTimer() {
        invalidateTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.currentTime = self.player?.currentTime ?? 0
            if self.currentTime >= self.athanMaxDuration {
                self.stop()
            }
        }
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        stop()
    }

    func previewSound(soundType: NotificationSoundType, duration: TimeInterval = 8) {
        guard let fileName = soundType.fileName,
              let url = Bundle.main.url(forResource: fileName, withExtension: nil) else {
            return
        }
        play(url: url)
        invalidateTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.currentTime = self.player?.currentTime ?? 0
            if self.currentTime >= duration {
                self.stop()
            }
        }
    }

    private func invalidateTimer() {
        timer?.invalidate()
        timer = nil
    }
}
