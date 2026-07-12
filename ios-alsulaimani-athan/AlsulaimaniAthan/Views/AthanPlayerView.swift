import SwiftUI

struct AthanPlayerView: View {
    @ObservedObject var audio = AudioService.shared
    let onStop: () -> Void

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [AppColors.bg, Color(hex: "#091418"), Color(hex: "#060E12")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ZStack {
                ForEach(0..<3) { i in
                    Circle()
                        .stroke(AppColors.accent.opacity(0.2), lineWidth: 1)
                        .frame(width: 180 + CGFloat(i) * 80, height: 180 + CGFloat(i) * 80)
                        .scaleEffect(audio.isPlaying ? 1.2 + CGFloat(i) * 0.2 : 1)
                        .opacity(audio.isPlaying ? 0.7 - Double(i) * 0.2 : 0.3)
                        .animation(.easeInOut(duration: 1.5 + Double(i) * 0.5).repeatForever(autoreverses: true), value: audio.isPlaying)
                }

                Circle()
                    .stroke(AppColors.accent.opacity(0.25), style: StrokeStyle(lineWidth: 1.5, dash: [8, 8]))
                    .frame(width: 160, height: 160)
                    .rotationEffect(.degrees(audio.isPlaying ? 360 : 0))
                    .animation(.linear(duration: 20).repeatForever(autoreverses: false), value: audio.isPlaying)

                Image("icon")
                    .resizable()
                    .scaledToFill()
                    .frame(width: 120, height: 120)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(AppColors.accent, lineWidth: 3))
            }
            .padding(.bottom, 200)

            VStack(spacing: 12) {
                Spacer()

                Text("جارٍ تشغيل الأذان")
                    .font(.dubai(14, weight: .medium))
                    .foregroundStyle(AppColors.accent)
                    .tracking(1)

                Text("الله أكبر الله أكبر")
                    .font(.dubai(28, weight: .bold))
                    .foregroundStyle(AppColors.text)
                    .multilineTextAlignment(.center)

                VStack(spacing: 8) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2, style: .continuous)
                                .fill(AppColors.accent.opacity(0.15))
                                .frame(height: 4)
                            RoundedRectangle(cornerRadius: 2, style: .continuous)
                                .fill(AppColors.accent)
                                .frame(width: progressWidth(in: geo.size.width), height: 4)
                        }
                    }
                    .frame(height: 4)

                    HStack {
                        Text(formatTime(Int(audio.currentTime)))
                        Spacer()
                        Text(formatTime(Int(audio.duration)))
                    }
                    .font(.dubai(12, weight: .regular))
                    .foregroundStyle(AppColors.textMuted)
                }
                .padding(.horizontal, 40)
                .padding(.vertical, 20)

                Button {
                    onStop()
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "stop.fill")
                            .font(.system(size: 22))
                        Text("إيقاف الأذان")
                            .font(.dubai(18, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .frame(width: 240)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(
                            colors: [AppColors.danger, Color(hex: "#C0392B")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                }
                .padding(.bottom, 60)
            }
        }
    }

    private func progressWidth(in totalWidth: CGFloat) -> CGFloat {
        guard audio.duration > 0 else { return 0 }
        return CGFloat(audio.currentTime / audio.duration) * totalWidth
    }

    private func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return "\(m):\(String(format: "%02d", s))"
    }
}
