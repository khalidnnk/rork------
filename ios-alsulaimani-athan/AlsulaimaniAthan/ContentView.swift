import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = AthanViewModel()
    @State private var selectedTab = 0

    var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                HomeView()
                    .tabItem {
                        Image(systemName: "house")
                        Text("المواقيت")
                    }
                    .tag(0)

                SettingsView()
                    .tabItem {
                        Image(systemName: "gear")
                        Text("الإعدادات")
                    }
                    .tag(1)
            }
            .tint(AppColors.accent)
            .environmentObject(viewModel)
            .onAppear {
                viewModel.requestNotificationPermission()
            }

            if viewModel.isAdhanPlaying {
                AthanPlayerView {
                    viewModel.stopAthan()
                }
                .transition(.opacity)
                .zIndex(1)
            }

            if viewModel.showLocationOnboarding {
                LocationOnboardingView { granted in
                    viewModel.dismissLocationOnboarding(granted: granted)
                }
                .transition(.opacity)
                .zIndex(2)
            }
        }
        .animation(.easeInOut, value: viewModel.isAdhanPlaying)
        .animation(.easeInOut, value: viewModel.showLocationOnboarding)
    }
}
