import SwiftUI

enum AppColors {
    static let bg = Color(hex: "#0B1A1F")
    static let bgLight = Color(hex: "#0F2229")
    static let card = Color(hex: "#132D38")
    static let cardBorder = Color(hex: "#1A3D4A")
    static let surface = Color(hex: "#173540")
    static let accent = Color(hex: "#C9A84C")
    static let accentDim = Color(hex: "#C9A84C").opacity(0.15)
    static let accentLight = Color(hex: "#E2C66A")
    static let accentSoft = Color(hex: "#C9A84C").opacity(0.08)
    static let text = Color(hex: "#ECF0F1")
    static let textSecondary = Color(hex: "#8BA4AD")
    static let textMuted = Color(hex: "#4A6670")
    static let success = Color(hex: "#2ECC71")
    static let successDim = Color(hex: "#2ECC71").opacity(0.15)
    static let danger = Color(hex: "#E74C3C")
    static let dangerDim = Color(hex: "#E74C3C").opacity(0.15)
    static let white = Color.white
    static let separator = Color(hex: "#1A3D4A")
    static let overlay = Color.black.opacity(0.65)
    static let teal = Color(hex: "#1ABC9C")
    static let tealDim = Color(hex: "#1ABC9C").opacity(0.15)
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
