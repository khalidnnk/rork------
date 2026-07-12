import SwiftUI

extension Font {
    static func dubai(_ size: CGFloat, weight: DubaiFontWeight = .regular) -> Font {
        return .custom(weight.rawValue, size: size)
    }
}

enum DubaiFontWeight: String {
    case light = "Dubai-Light"
    case regular = "Dubai-Regular"
    case medium = "Dubai-Medium"
    case bold = "Dubai-Bold"
}
