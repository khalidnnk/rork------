import SwiftUI

struct AboutModal: View {
    let onDismiss: () -> Void

    var body: some View {
        ZStack {
            AppColors.overlay.ignoresSafeArea()

            VStack(spacing: 0) {
                ZStack {
                    LinearGradient(
                        colors: [AppColors.card, AppColors.bgLight, AppColors.bg],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(AppColors.accent.opacity(0.2), lineWidth: 1)
                    )

                    VStack(spacing: 20) {
                        Circle()
                            .fill(AppColors.accentDim)
                            .frame(width: 64, height: 64)
                            .overlay(
                                Image(systemName: "heart.fill")
                                    .font(.system(size: 32))
                                    .foregroundStyle(AppColors.accent)
                            )

                        Text("عن التطبيق")
                            .font(.dubai(24, weight: .bold))
                            .foregroundStyle(AppColors.text)

                        Text("تم إنشاء هذا التطبيق احتساباً للأجر عن عبدالرحمن السليماني")
                            .font(.dubai(16, weight: .medium))
                            .foregroundStyle(AppColors.accentLight)
                            .multilineTextAlignment(.center)
                            .lineSpacing(6)

                        Rectangle()
                            .fill(AppColors.accent.opacity(0.25))
                            .frame(width: 40, height: 1)

                        Text("اللهم اجعل له أجراً ومغفرة بكل (الله أكبر) ترفع في هذا التطبيق")
                            .font(.dubai(16, weight: .medium))
                            .foregroundStyle(AppColors.accent)
                            .multilineTextAlignment(.center)
                            .lineSpacing(6)

                        Image("icon")
                            .resizable()
                            .scaledToFill()
                            .frame(width: 90, height: 90)
                            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))

                        Button {
                            onDismiss()
                        } label: {
                            Text("إغلاق")
                                .font(.dubai(17, weight: .bold))
                                .foregroundStyle(AppColors.bg)
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
                        .padding(.top, 4)
                    }
                    .padding(32)
                }
                .frame(maxWidth: 340)
            }
        }
    }
}
