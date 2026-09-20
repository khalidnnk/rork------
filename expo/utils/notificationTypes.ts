export type NotificationSoundType = 'athan' | 'allahu_akbar' | 'default' | 'silent';

const ALLOWED_NOTIFICATION_SOUNDS: readonly NotificationSoundType[] = [
  'athan',
  'allahu_akbar',
  'default',
  'silent',
];

export function isNotificationSoundType(value: unknown): value is NotificationSoundType {
  return typeof value === 'string'
    && (ALLOWED_NOTIFICATION_SOUNDS as readonly string[]).includes(value);
}

export function normalizeNotificationSound(value: unknown): NotificationSoundType {
  return isNotificationSoundType(value) ? value : 'athan';
}
