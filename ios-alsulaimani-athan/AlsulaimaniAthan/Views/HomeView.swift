import SwiftUI

struct HomeView: View {
    @EnvironmentObject var viewModel: AthanViewModel
    @State private var showAbout = false
    @State private var showWelcome = false
    @State private var animateCards = false

    var body: some View {
        ZStack {
            GeometryReader { geo in
                Image(geo.size.width >= 768 ? "bg-tablet" : "bg-phone")
                    .resizable()
                    .scaledToFill()
                    .ignoresSafeArea()
            }

            LinearGradient(
                colors: [AppColors.bgLight.opacity(0.55), AppColors.bg.opacity(0.75), AppColors.bg.opacity(0.9)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    header
                        .padding(.top, 12)
                        .padding(.horizontal, 20)

                    if let nextPrayer = viewModel.nextPrayer {
                        countdownCard(nextPrayer)
                            .padding(.horizontal, 20)
                            .padding(.top, 20)
                            .transition(.scale.combined(with: .opacity))
                    }

                    HStack {
                        Text("مواقيت اليوم")
                            .font(.dubai(17, weight: .bold))
                            .foregroundStyle(AppColors.text)
                        Spacer()
                        Text("تقويم أم القرى")
                            .font(.dubai(11, weight: .regular))
                            .foregroundStyle(AppColors.text.opacity(0.7))
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 28)
                    .padding(.bottom, 12)

                    LazyVStack(spacing: 8) {
                        ForEach(Array(viewModel.dailyPrayers.prayers.enumerated()), id: \.element.id) { index, prayer in
                            PrayerRow(
                                prayer: prayer,
                                isNext: viewModel.nextPrayer?.name == prayer.name,
                                isPast: prayer.time < Date(),
                                isEnabled: viewModel.settings.enabledPrayers[prayer.name] == true,
                                globalEnabled: viewModel.settings.globalEnabled,
                                offset: viewModel.settings.offsets[prayer.name] ?? 0,
                                index: index
                            )
                            .opacity(animateCards ? 1 : 0)
                            .offset(y: animateCards ? 0 : 40)
                            .animation(.easeOut(duration: 0.45).delay(0.2 + Double(index) * 0.09), value: animateCards)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
        }
        .onAppear {
            if !viewModel.settings.hasSeenWelcome {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                    showWelcome = true
                }
            }
            withAnimation(.easeOut(duration: 0.7)) {
                animateCards = true
            }
        }
        .overlay {
            if showWelcome {
                WelcomeModal {
                    viewModel.dismissWelcome()
                    showWelcome = false
                }
                .transition(.opacity.combined(with: .scale))
            }
        }
        .overlay {
            if showAbout {
                AboutModal {
                    showAbout = false
                }
                .transition(.opacity.combined(with: .scale))
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                HStack(spacing: 12) {
                    Image("icon")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 48, height: 48)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    VStack(alignment: .leading, spacing: 2) {
                        Text("أذان السليماني")
                            .font(.dubai(26, weight: .bold))
                            .foregroundStyle(AppColors.text)
                        Text("Alsulaimani Athan")
                            .font(.dubai(13, weight: .medium))
                            .foregroundStyle(AppColors.accent)
                            .tracking(1.5)
                    }
                }

                Spacer()

                Button {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    showAbout = true
                } label: {
                    Circle()
                        .fill(AppColors.textMuted.opacity(0.2))
                        .frame(width: 44, height: 44)
                        .overlay(
                            Image(systemName: "info")
                                .font(.system(size: 18))
                                .foregroundStyle(AppColors.textSecondary)
                        )
                        .overlay(
                            Circle()
                                .stroke(AppColors.textMuted.opacity(0.3), lineWidth: 1)
                        )
                }
            }

            HStack(spacing: 5) {
                Image(systemName: "mappin")
                    .font(.system(size: 12))
                    .foregroundStyle(AppColors.textSecondary)
                Text(viewModel.locationLoading ? "جارٍ تحديد الموقع..." : viewModel.settings.locationName)
                    .font(.dubai(13, weight: .regular))
                    .foregroundStyle(.white)
            }
            .padding(.top, 14)

            Text(Date().arabicDateString)
                .font(.dubai(13, weight: .regular))
                .foregroundStyle(.white)
                .padding(.top, 4)
        }
    }

    private func countdownCard(_ prayer: PrayerTime) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(AppColors.accent.opacity(0.03))
                .overlay(
                    LinearGradient(
                        colors: [AppColors.accent.opacity(0.10), AppColors.accent.opacity(0.03)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(AppColors.accent.opacity(0.18), lineWidth: 1)
                )

            VStack(spacing: 0) {
                HStack(spacing: 6) {
                    Image(systemName: "clock")
                        .font(.system(size: 13))
                        .foregroundStyle(AppColors.accent)
                    Text("الصلاة القادمة")
                        .font(.dubai(12, weight: .medium))
                        .foregroundStyle(AppColors.accent)
                        .tracking(0.5)
                }
                .padding(.bottom, 10)

                Text(prayer.labelAr)
                    .font(.dubai(28, weight: .bold))
                    .foregroundStyle(AppColors.text)

                Text(prayer.label)
                    .font(.dubai(14, weight: .regular))
                    .foregroundStyle(.white.opacity(0.85))
                    .padding(.top, 2)
                    .padding(.bottom, 18)

                HStack(alignment: .top, spacing: 8) {
                    timerSegment(value: viewModel.countdown.hours, unit: "ساعة")
                    Text(":")
                        .font(.dubai(28, weight: .light))
                        .foregroundStyle(.white.opacity(0.7))
                        .padding(.top, -16)
                    timerSegment(value: viewModel.countdown.minutes, unit: "دقيقة")
                    Text(":")
                        .font(.dubai(28, weight: .light))
                        .foregroundStyle(.white.opacity(0.7))
                        .padding(.top, -16)
                    timerSegment(value: viewModel.countdown.seconds, unit: "ثانية")
                }
                .padding(.bottom, 14)

                Text(prayer.timeStr)
                    .font(.dubai(14, weight: .regular))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(24)
        }
    }

    private func timerSegment(value: Int, unit: String) -> some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(AppColors.accent.opacity(0.08))
                .frame(width: 60, height: 52)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(AppColors.accent.opacity(0.12), lineWidth: 1)
                )
                .overlay(
                    Text(String(format: "%02d", value))
                        .font(.dubai(32, weight: .light))
                        .foregroundStyle(AppColors.text)
                )
            Text(unit)
                .font(.dubai(10, weight: .regular))
                .foregroundStyle(.white.opacity(0.75))
        }
    }
}

struct PrayerRow: View {
    let prayer: PrayerTime
    let isNext: Bool
    let isPast: Bool
    let isEnabled: Bool
    let globalEnabled: Bool
    let offset: Int
    let index: Int

    var body: some View {
        HStack {
            HStack(spacing: 12) {
                Circle()
                    .fill(isNext ? AppColors.accentDim : isPast ? AppColors.textMuted.opacity(0.2) : AppColors.surface)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Image(systemName: prayer.name.iconName)
                            .font(.system(size: 20))
                            .foregroundStyle(isNext ? AppColors.accent : isPast ? AppColors.textMuted : AppColors.textSecondary)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Text(prayer.labelAr)
                            .font(.dubai(16, weight: .medium))
                            .foregroundStyle(isNext ? AppColors.accentLight : isPast ? .white.opacity(0.6) : AppColors.text)
                        Text(prayer.label)
                            .font(.dubai(12, weight: .regular))
                            .foregroundStyle(isPast ? .white.opacity(0.6) : .white.opacity(0.85))
                    }
                    if offset > 0 {
                        Text("+\(offset) دقيقة")
                            .font(.dubai(10, weight: .medium))
                            .foregroundStyle(AppColors.accent)
                    }
                }
            }

            Spacer()

            HStack(spacing: 4) {
                Text(prayer.timeStr)
                    .font(.dubai(15, weight: .medium))
                    .foregroundStyle(isNext ? AppColors.accent : isPast ? .white.opacity(0.6) : AppColors.text)
                Image(systemName: isEnabled && globalEnabled ? "speaker.wave.2" : "speaker.slash")
                    .font(.system(size: 13))
                    .foregroundStyle(isNext ? AppColors.accent : AppColors.textMuted)
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(isNext ? AppColors.accent.opacity(0.06) : AppColors.card)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(isNext ? AppColors.accent.opacity(0.3) : AppColors.cardBorder, lineWidth: 1)
        )
        .opacity(isPast ? 0.45 : 1)
    }
}
