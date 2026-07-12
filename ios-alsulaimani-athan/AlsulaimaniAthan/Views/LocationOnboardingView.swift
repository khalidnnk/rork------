import SwiftUI

struct LocationOnboardingView: View {
    let onComplete: (Bool) -> Void

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [AppColors.bgLight, AppColors.bg, Color(hex: "#091418")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer().frame(height: 60)

                ZStack {
                    Circle()
                        .fill(AppColors.accent.opacity(0.15))
                        .frame(width: 120, height: 120)
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(AppColors.bg)
                        .frame(width: 90, height: 90)
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .stroke(AppColors.accent.opacity(0.3), lineWidth: 2)
                        )
                    Image("icon")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 90, height: 90)
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                }
                .padding(.bottom, 24)

                Text("أذان السليماني")
                    .font(.dubai(28, weight: .bold))
                    .foregroundStyle(AppColors.text)
                    .padding(.bottom, 12)

                Text("يحتاج التطبيق إلى موقعك لحساب\nمواقيت الصلاة بدقة في منطقتك")
                    .font(.dubai(16, weight: .regular))
                    .foregroundStyle(AppColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)
                    .padding(.bottom, 40)

                VStack(spacing: 16) {
                    featureRow(
                        icon: "location.north.line",
                        title: "مواقيت دقيقة حسب موقعك",
                        subtitle: "حساب أوقات الصلاة بدقة بناءً على إحداثياتك الجغرافية"
                    )
                    featureRow(
                        icon: "mappin.and.ellipse",
                        title: "تحديد المدينة تلقائياً",
                        subtitle: "معرفة مدينتك لعرض اسمها وضبط التوقيت المحلي"
                    )
                    featureRow(
                        icon: "shield",
                        title: "خصوصيتك محفوظة",
                        subtitle: "لا يتم مشاركة موقعك أو تخزينه خارج جهازك"
                    )
                }

                Spacer()

                VStack(spacing: 14) {
                    Button {
                        LocationService.shared.requestPermission()
                        onComplete(LocationService.shared.authorizationStatus == .authorizedWhenInUse || LocationService.shared.authorizationStatus == .authorizedAlways)
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "mappin")
                                .font(.system(size: 20))
                            Text("السماح بتحديد الموقع")
                                .font(.dubai(18, weight: .bold))
                        }
                        .foregroundStyle(AppColors.bg)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [AppColors.accent, Color(hex: "#B8922E")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }

                    Button {
                        onComplete(false)
                    } label: {
                        Text("تخطي واختيار المدينة يدوياً")
                            .font(.dubai(14, weight: .medium))
                            .foregroundStyle(AppColors.textMuted)
                            .padding(.vertical, 12)
                    }
                }
                .padding(.bottom, 20)
            }
            .padding(.horizontal, 28)
        }
    }

    private func featureRow(icon: String, title: String, subtitle: String) -> some View {
        HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(AppColors.accent.opacity(0.10))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundStyle(AppColors.accent)
                )

            VStack(alignment: .trailing, spacing: 2) {
                Text(title)
                    .font(.dubai(15, weight: .medium))
                    .foregroundStyle(AppColors.text)
                Text(subtitle)
                    .font(.dubai(12, weight: .regular))
                    .foregroundStyle(AppColors.textSecondary)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(16)
        .background(AppColors.card.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(AppColors.cardBorder.opacity(0.5), lineWidth: 1)
        )
    }
}
