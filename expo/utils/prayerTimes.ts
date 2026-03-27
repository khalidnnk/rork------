export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTime {
  name: PrayerName;
  label: string;
  labelAr: string;
  time: Date;
  timeStr: string;
}

export interface DailyPrayers {
  date: Date;
  prayers: PrayerTime[];
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function sin(deg: number): number {
  return Math.sin(deg * DEG_TO_RAD);
}

function cos(deg: number): number {
  return Math.cos(deg * DEG_TO_RAD);
}

function tan(deg: number): number {
  return Math.tan(deg * DEG_TO_RAD);
}

function arcsin(x: number): number {
  return Math.asin(x) * RAD_TO_DEG;
}

function arccos(x: number): number {
  return Math.acos(x) * RAD_TO_DEG;
}

function arctan2(y: number, x: number): number {
  return Math.atan2(y, x) * RAD_TO_DEG;
}

function fixAngle(a: number): number {
  return a - 360.0 * Math.floor(a / 360.0);
}

function fixHour(h: number): number {
  return h - 24.0 * Math.floor(h / 24.0);
}

function julianDate(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { declination: number; equation: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
  const decl = arcsin(sin(e) * sin(L));
  const eqt = q / 15 - fixHour(RA);
  return { declination: decl, equation: eqt };
}

function midDay(jd: number, tz: number, lng: number): number {
  const sp = sunPosition(jd);
  const noon = fixHour(12 - sp.equation);
  return noon + (tz - lng / 15);
}

function sunAngleTime(
  jd: number,
  angle: number,
  lat: number,
  tz: number,
  lng: number,
  direction: 'ccw' | 'cw'
): number {
  const sp = sunPosition(jd);
  const noon = midDay(jd, tz, lng);
  const decl = sp.declination;
  const cosHA = (sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
  if (cosHA < -1 || cosHA > 1) {
    return NaN;
  }
  const HA = arccos(cosHA) / 15;
  return noon + (direction === 'ccw' ? -HA : HA);
}

function asrTime(
  jd: number,
  factor: number,
  lat: number,
  tz: number,
  lng: number
): number {
  const sp = sunPosition(jd);
  const decl = sp.declination;
  const noon = midDay(jd, tz, lng);
  const angle = arctan2(1, factor + tan(Math.abs(lat - decl)));
  const cosHA = (sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
  if (cosHA < -1 || cosHA > 1) {
    return NaN;
  }
  const HA = arccos(cosHA) / 15;
  return noon + HA;
}

function isRamadan(date: Date): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      month: 'numeric',
    });
    const hijriMonth = parseInt(formatter.format(date), 10);
    console.log('[PrayerTimes] Hijri month (Umm Al-Qura):', hijriMonth, hijriMonth === 9 ? '(Ramadan)' : '');
    return hijriMonth === 9;
  } catch (e) {
    console.warn('[PrayerTimes] Could not determine Hijri month:', e);
    return false;
  }
}

function hoursToDate(hours: number, baseDate: Date): Date {
  const h = Math.floor(hours);
  const minFloat = (hours - h) * 60;
  const m = Math.floor(minFloat);
  const s = Math.floor((minFloat - m) * 60);
  const result = new Date(baseDate);
  result.setHours(h, m, s, 0);
  return result;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

const PRAYER_LABELS: Record<PrayerName, { label: string; labelAr: string }> = {
  fajr: { label: 'Fajr', labelAr: 'الفجر' },
  dhuhr: { label: 'Dhuhr', labelAr: 'الظهر' },
  asr: { label: 'Asr', labelAr: 'العصر' },
  maghrib: { label: 'Maghrib', labelAr: 'المغرب' },
  isha: { label: 'Isha', labelAr: 'العشاء' },
};

export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: number,
  offsets: Record<PrayerName, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
): DailyPrayers {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const jd = julianDate(year, month, day);
  const lat = latitude;
  const lng = longitude;
  const tz = timezone;

  const FAJR_ANGLE = -18.5;
  const SUNRISE_ANGLE = -0.833;
  const ASR_FACTOR = 1;
  const isRamadanNow = isRamadan(date);
  const ISHA_MINUTES = isRamadanNow ? 120 : 90;

  const fajrHours = sunAngleTime(jd, FAJR_ANGLE, lat, tz, lng, 'ccw');
  const dhuhrHours = midDay(jd, tz, lng) + 1 / 60;
  const asrHours = asrTime(jd, ASR_FACTOR, lat, tz, lng);
  const maghribHours = sunAngleTime(jd, SUNRISE_ANGLE, lat, tz, lng, 'cw');
  const ishaHours = maghribHours + ISHA_MINUTES / 60;
  const baseDate = new Date(year, month - 1, day);

  const prayerNames: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const hours = [fajrHours, dhuhrHours, asrHours, maghribHours, ishaHours];

  const prayers: PrayerTime[] = prayerNames.map((name, i) => {
    const adjustedHours = hours[i] + (offsets[name] || 0) / 60;
    const time = hoursToDate(adjustedHours, baseDate);
    return {
      name,
      label: PRAYER_LABELS[name].label,
      labelAr: PRAYER_LABELS[name].labelAr,
      time,
      timeStr: formatTime(time),
    };
  });

  return { date: baseDate, prayers };
}

export function getNextPrayer(prayers: PrayerTime[], nowOverride?: Date): PrayerTime | null {
  const now = nowOverride ?? new Date();
  const nowMs = now.getTime();
  for (const prayer of prayers) {
    if (prayer.time.getTime() > nowMs) {
      return prayer;
    }
  }
  return null;
}

export function getNextPrayerWithTomorrow(
  todayPrayers: PrayerTime[],
  latitude: number,
  longitude: number,
  timezone: number,
  offsets: Record<PrayerName, number>
): { prayer: PrayerTime; isTomorrow: boolean } | null {
  const now = new Date();
  const todayNext = getNextPrayer(todayPrayers, now);
  if (todayNext) {
    return { prayer: todayNext, isTomorrow: false };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPrayers = calculatePrayerTimes(tomorrow, latitude, longitude, timezone, offsets);
  if (tomorrowPrayers.prayers.length > 0) {
    console.log('[PrayerTimes] All today prayers passed, showing tomorrow Fajr');
    return { prayer: tomorrowPrayers.prayers[0], isTomorrow: true };
  }
  return null;
}

export function getDateKey(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getTimezoneOffset(): number {
  return -(new Date().getTimezoneOffset() / 60);
}

export function getTimeUntil(target: Date): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}
