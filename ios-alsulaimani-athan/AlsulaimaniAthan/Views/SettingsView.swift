import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var viewModel: AthanViewModel
    @State private var showCityPicker = false

    private let prayerNames: [PrayerName] = [.fajr, .dhuhr, .asr, .maghrib, .isha]
    private let offsetOptions = [0, 2, 5]
    private let soundOptions = NotificationSoundType.allCases

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
                    HStack(spacing: 10) {
                        Image(systemName: "gear")
                            .font(.system(size: 22))
                            .foregroundStyle(AppColors.accent)
                        Text("الإعدادات")
                            .font(.dubai(26, weight: .bold))
                            .foregroundStyle(AppColors.text)
                        Spacer()
                    }
                    .padding(.top, 12)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 28)

                    section("المنبّه") {
                        HStack {
                            HStack(spacing: 12) {
                                Image(systemName: viewModel.settings.globalEnabled ? "bell" : "bell.slash")
                                    .font(.system(size: 18))
                                    .foregroundStyle(viewModel.settings.globalEnabled ? AppColors.accent : AppColors.danger)

                                VStack(alignment: .leading, spacing: 1) {
                                    Text("الأذان العام")
                                        .font(.dubai(15, weight: .medium))
                                        .foregroundStyle(AppColors.text)
                                    Text(viewModel.settings.globalEnabled ? "الإشعارات مفعّلة" : "جميع الإشعارات متوقفة")
                                        .font(.dubai(12, weight: .regular))
                                        .foregroundStyle(AppColors.textSecondary)
                                }
                            }

                            Spacer()

                            Toggle("", isOn: Binding(
                                get: { viewModel.settings.globalEnabled },
                                set: { _ in viewModel.toggleGlobal() }
                            ))
                            .tint(AppColors.accent)
                            .labelsHidden()
                        }
                        .padding(.vertical, 14)
                        .padding(.horizontal, 16)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)

                    section("تشغيل الأذان") {
                        Button {
                            let impact = UIImpactFeedbackGenerator(style: .medium)
                            impact.impactOccurred()
                            viewModel.playAthan()
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "play.fill")
                                    .font(.system(size: 20))
                                    .foregroundStyle(AppColors.bg)
                                Text("تشغيل الأذان كاملاً")
                                    .font(.dubai(16, weight: .bold))
                                    .foregroundStyle(AppColors.bg)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                LinearGradient(
                                    colors: [AppColors.accent, Color(hex: "#B8922E")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)

                    sectionWithDescription("صوت التنبيه", description: "اختر الصوت الذي يصدر عند وقت الصلاة") {
                        VStack(spacing: 0) {
                            ForEach(Array(soundOptions.enumerated()), id: \.element.id) { index, option in
                                if index > 0 {
                                    Divider()
                                        .background(AppColors.separator)
                                        .padding(.horizontal, 16)
                                }
                                soundOptionRow(option)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)

                    section("تفعيل الصلوات") {
                        VStack(spacing: 0) {
                            ForEach(Array(prayerNames.enumerated()), id: \.element.id) { index, name in
                                if index > 0 {
                                    Divider()
                                        .background(AppColors.separator)
                                        .padding(.horizontal, 16)
                                }
                                HStack {
                                    HStack(spacing: 12) {
                                        Image(systemName: viewModel.settings.enabledPrayers[name] == true && viewModel.settings.globalEnabled ? "speaker.wave.2" : "speaker.slash")
                                            .font(.system(size: 16))
                                            .foregroundStyle(viewModel.settings.enabledPrayers[name] == true && viewModel.settings.globalEnabled ? AppColors.accent : AppColors.textMuted)

                                        Text(name.labelAr)
                                            .font(.dubai(15, weight: .medium))
                                            .foregroundStyle(AppColors.text)
                                    }

                                    Spacer()

                                    Toggle("", isOn: Binding(
                                        get: { viewModel.settings.enabledPrayers[name] ?? false },
                                        set: { _ in viewModel.togglePrayer(name) }
                                    ))
                                    .tint(AppColors.accent)
                                    .labelsHidden()
                                }
                                .padding(.vertical, 12)
                                .padding(.horizontal, 16)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)

                    sectionWithDescription("تأخير وقت الأذان", description: "إضافة دقائق بعد وقت الصلاة المحسوب") {
                        VStack(spacing: 0) {
                            ForEach(Array(prayerNames.enumerated()), id: \.element.id) { index, name in
                                if index > 0 {
                                    Divider()
                                        .background(AppColors.separator)
                                        .padding(.horizontal, 16)
                                }
                                HStack {
                                    Text(name.labelAr)
                                        .font(.dubai(15, weight: .medium))
                                        .foregroundStyle(AppColors.text)

                                    Spacer()

                                    HStack(spacing: 6) {
                                        ForEach(offsetOptions, id: \.self) { opt in
                                            Button {
                                                let impact = UISelectionFeedbackGenerator()
                                                impact.selectionChanged()
                                                viewModel.setOffset(name, opt)
                                            } label: {
                                                Text(opt == 0 ? "دقيق" : "+\(opt)")
                                                    .font(.dubai(12, weight: .medium))
                                                    .foregroundStyle(viewModel.settings.offsets[name] == opt ? AppColors.accent : AppColors.textSecondary)
                                                    .padding(.horizontal, 12)
                                                    .padding(.vertical, 6)
                                                    .background(viewModel.settings.offsets[name] == opt ? AppColors.accentDim : AppColors.surface)
                                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                                    .overlay(
                                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                                            .stroke(viewModel.settings.offsets[name] == opt ? AppColors.accent.opacity(0.3) : Color.clear, lineWidth: 1)
                                                    )
                                            }
                                        }
                                    }
                                }
                                .padding(.vertical, 12)
                                .padding(.horizontal, 16)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)

                    section("الموقع") {
                        VStack(spacing: 0) {
                            infoRow(icon: "mappin", iconColor: AppColors.accent, title: "الموقع الحالي", subtitle: viewModel.locationLoading ? "جارٍ تحديد الموقع..." : viewModel.settings.locationName)
                            Divider().background(AppColors.separator).padding(.horizontal, 16)
                            infoRow(icon: "location", iconColor: AppColors.textSecondary, title: "الإحداثيات", subtitle: "\(String(format: "%.4f", viewModel.settings.latitude))°N, \(String(format: "%.4f", viewModel.settings.longitude))°E")
                            Divider().background(AppColors.separator).padding(.horizontal, 16)
                            infoRow(icon: "clock", iconColor: AppColors.textSecondary, title: "المنطقة الزمنية", subtitle: "UTC\(viewModel.settings.timezone >= 0 ? "+" : "")\(Int(viewModel.settings.timezone))")
                            Divider().background(AppColors.separator).padding(.horizontal, 16)

                            HStack {
                                Button {
                                    let impact = UIImpactFeedbackGenerator(style: .medium)
                                    impact.impactOccurred()
                                    viewModel.detectAutoLocation()
                                } label: {
                                    HStack(spacing: 7) {
                                        Image(systemName: "location.north")
                                            .font(.system(size: 15))
                                            .foregroundStyle(AppColors.teal)
                                        Text(viewModel.locationLoading ? "جارٍ التحديث..." : "تحديد تلقائي GPS")
                                            .font(.dubai(13, weight: .medium))
                                            .foregroundStyle(AppColors.teal)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                }

                                Rectangle()
                                    .fill(AppColors.separator)
                                    .frame(width: 1, height: 24)

                                Button {
                                    let impact = UIImpactFeedbackGenerator(style: .light)
                                    impact.impactOccurred()
                                    showCityPicker = true
                                } label: {
                                    HStack(spacing: 7) {
                                        Image(systemName: "list.bullet")
                                            .font(.system(size: 15))
                                            .foregroundStyle(AppColors.accent)
                                        Text("اختيار المدينة يدوياً")
                                            .font(.dubai(13, weight: .medium))
                                            .foregroundStyle(AppColors.accent)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
                    .sheet(isPresented: $showCityPicker) {
                        CityPickerView(
                            currentCityName: viewModel.settings.locationName,
                            onSelect: { city in
                                let impact = UIImpactFeedbackGenerator(style: .medium)
                                impact.impactOccurred()
                                viewModel.setLocation(latitude: city.latitude, longitude: city.longitude, name: city.nameAr, timezone: city.timezone, mode: .manual)
                            }
                        )
                    }

                    section("طريقة الحساب") {
                        VStack(spacing: 0) {
                            HStack {
                                HStack(spacing: 12) {
                                    Image(systemName: "function")
                                        .font(.system(size: 18))
                                        .foregroundStyle(AppColors.accent)
                                    Text("تقويم أم القرى (مكة)")
                                        .font(.dubai(15, weight: .medium))
                                        .foregroundStyle(AppColors.text)
                                }
                                Spacer()
                                Text("ثابت")
                                    .font(.dubai(11, weight: .medium))
                                    .foregroundStyle(AppColors.textMuted)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(AppColors.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                            }
                            .padding(.vertical, 14)
                            .padding(.horizontal, 16)

                            Divider().background(AppColors.separator).padding(.horizontal, 16)

                            HStack {
                                calcDetail(icon: "sunrise", label: "الفجر", value: "18.5°")
                                Rectangle()
                                    .fill(AppColors.separator)
                                    .frame(width: 1, height: 28)
                                calcDetail(icon: "moon", label: "العشاء", value: "90 د بعد المغرب")
                            }
                            .padding(.vertical, 14)
                            .padding(.horizontal, 16)

                            Divider().background(AppColors.separator).padding(.horizontal, 16)

                            HStack(spacing: 12) {
                                HStack(spacing: 4) {
                                    Image(systemName: "moon")
                                        .font(.system(size: 12))
                                        .foregroundStyle(AppColors.accent)
                                    Text("رمضان")
                                        .font(.dubai(11, weight: .bold))
                                        .foregroundStyle(AppColors.accent)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(AppColors.accentDim)
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                                VStack(alignment: .trailing, spacing: 1) {
                                    Text("العشاء في رمضان")
                                        .font(.dubai(14, weight: .medium))
                                        .foregroundStyle(AppColors.text)
                                    Text("120 دقيقة بعد المغرب (بدلاً من 90)")
                                        .font(.dubai(12, weight: .regular))
                                        .foregroundStyle(AppColors.textSecondary)
                                }
                                Spacer()
                            }
                            .padding(.vertical, 12)
                            .padding(.horizontal, 16)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)

                    Text("ليبقى أثر صوته حاضرًا")
                        .font(.dubai(14, weight: .medium))
                        .foregroundStyle(AppColors.accent.opacity(0.7))
                        .padding(.vertical, 20)
                        .padding(.bottom, 10)
                }
            }
        }
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.dubai(12, weight: .medium))
                .foregroundStyle(AppColors.textMuted)
                .padding(.leading, 4)
            content()
                .background(AppColors.card)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(AppColors.cardBorder, lineWidth: 1)
                )
        }
    }

    private func sectionWithDescription(_ title: String, description: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.dubai(12, weight: .medium))
                .foregroundStyle(AppColors.textMuted)
                .padding(.leading, 4)
            Text(description)
                .font(.dubai(12, weight: .regular))
                .foregroundStyle(AppColors.textSecondary)
                .padding(.leading, 4)
            content()
                .background(AppColors.card)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(AppColors.cardBorder, lineWidth: 1)
                )
        }
    }

    private func infoRow(icon: String, iconColor: Color, title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(iconColor)

            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.dubai(15, weight: .medium))
                    .foregroundStyle(AppColors.text)
                Text(subtitle)
                    .font(.dubai(12, weight: .regular))
                    .foregroundStyle(AppColors.textSecondary)
            }
            Spacer()
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
    }

    private func soundOptionRow(_ option: NotificationSoundType) -> some View {
        let active = viewModel.settings.notificationSound == option
        return HStack {
            Button {
                let impact = UIImpactFeedbackGenerator(style: .light)
                impact.impactOccurred()
                viewModel.updateSettings { $0.notificationSound = option }
            } label: {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .stroke(active ? AppColors.accent : AppColors.textMuted, lineWidth: 2)
                            .frame(width: 22, height: 22)
                        if active {
                            Circle()
                                .fill(AppColors.accent)
                                .frame(width: 12, height: 12)
                        }
                    }

                    VStack(alignment: .leading, spacing: 1) {
                        Text(option.label)
                            .font(.dubai(15, weight: .medium))
                            .foregroundStyle(active ? AppColors.accent : AppColors.text)
                        Text(option.description)
                            .font(.dubai(12, weight: .regular))
                            .foregroundStyle(AppColors.textSecondary)
                    }
                    Spacer()
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            HStack(spacing: 10) {
                if option != .silent {
                    Button {
                        let impact = UIImpactFeedbackGenerator(style: .light)
                        impact.impactOccurred()
                        viewModel.previewSound(option)
                    } label: {
                        Circle()
                            .fill(viewModel.isPreviewPlaying && viewModel.previewingSoundType == option ? AppColors.accentDim : AppColors.surface)
                            .frame(width: 36, height: 36)
                            .overlay(
                                Image(systemName: viewModel.isPreviewPlaying && viewModel.previewingSoundType == option ? "stop.fill" : "speaker.wave.1")
                                    .font(.system(size: 15))
                                    .foregroundStyle(active ? AppColors.accent : AppColors.textSecondary)
                            )
                            .overlay(
                                Circle()
                                    .stroke(viewModel.isPreviewPlaying && viewModel.previewingSoundType == option ? AppColors.accent.opacity(0.3) : Color.clear, lineWidth: 1)
                            )
                    }
                }

                if active {
                    Text("مفعّل")
                        .font(.dubai(11, weight: .medium))
                        .foregroundStyle(AppColors.accent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(AppColors.accentDim)
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                }
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
    }

    private func calcDetail(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(AppColors.textSecondary)
            Text(label)
                .font(.dubai(13, weight: .medium))
                .foregroundStyle(AppColors.textSecondary)
            Text(value)
                .font(.dubai(13, weight: .bold))
                .foregroundStyle(AppColors.text)
        }
        .frame(maxWidth: .infinity)
    }
}
