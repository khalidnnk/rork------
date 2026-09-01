/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'AlsulaimaniPrayerWidget',
  displayName: 'أذان السليماني',
  bundleIdentifier: '.prayerwidget',
  deploymentTarget: '16.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $accent: '#C9A84C',
    $widgetBackground: '#0B1A1F',
  },
  images: {
    widgetBackground: '../../assets/images/bg-phone.png',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
