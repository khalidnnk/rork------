import {
  calculatePrayerTimes,
  getNextPrayer,
  getNextPrayerWithTomorrow,
  PrayerName,
} from '../utils/prayerTimes';

const RIYADH = { lat: 24.7136, lng: 46.6753, tz: 3 };
const MECCA = { lat: 21.4225, lng: 39.8262, tz: 3 };

const DEFAULT_OFFSETS: Record<PrayerName, number> = {
  fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
};

describe('Prayer Times Calculation', () => {
  const testDate = new Date(2026, 2, 1);

  it('should calculate all 5 prayer times for Riyadh', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    expect(result.prayers).toHaveLength(5);

    const names = result.prayers.map(p => p.name);
    expect(names).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });

  it('should have prayer times in chronological order', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    for (let i = 1; i < result.prayers.length; i++) {
      const prev = result.prayers[i - 1].time.getTime();
      const curr = result.prayers[i].time.getTime();
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('should have Fajr before 6 AM and Isha after 6 PM for Riyadh', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const fajr = result.prayers.find(p => p.name === 'fajr')!;
    const isha = result.prayers.find(p => p.name === 'isha')!;

    expect(fajr.time.getHours()).toBeLessThan(6);
    expect(isha.time.getHours()).toBeGreaterThanOrEqual(18);
  });

  it('should have Dhuhr around noon (11-13)', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const dhuhr = result.prayers.find(p => p.name === 'dhuhr')!;
    expect(dhuhr.time.getHours()).toBeGreaterThanOrEqual(11);
    expect(dhuhr.time.getHours()).toBeLessThanOrEqual(13);
  });

  it('should have Maghrib between 5 PM and 7 PM for Riyadh in March', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const maghrib = result.prayers.find(p => p.name === 'maghrib')!;
    expect(maghrib.time.getHours()).toBeGreaterThanOrEqual(17);
    expect(maghrib.time.getHours()).toBeLessThanOrEqual(19);
  });

  it('should produce valid Date objects with correct date', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    for (const prayer of result.prayers) {
      expect(prayer.time).toBeInstanceOf(Date);
      expect(isNaN(prayer.time.getTime())).toBe(false);
      expect(prayer.time.getFullYear()).toBe(2026);
      expect(prayer.time.getMonth()).toBe(2);
      expect(prayer.time.getDate()).toBe(1);
    }
  });

  it('should produce valid timeStr in AM/PM format', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const timeRegex = /^\d{1,2}:\d{2} (AM|PM)$/;
    for (const prayer of result.prayers) {
      expect(prayer.timeStr).toMatch(timeRegex);
    }
  });

  it('should include Arabic labels for all prayers', () => {
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const expectedAr: Record<PrayerName, string> = {
      fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
    };

    for (const prayer of result.prayers) {
      expect(prayer.labelAr).toBe(expectedAr[prayer.name]);
    }
  });
});

describe('Prayer Time Offsets', () => {
  const testDate = new Date(2026, 2, 1);

  it('should apply positive offset (delay prayer time)', () => {
    const noOffset = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);
    const withOffset = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, {
      ...DEFAULT_OFFSETS,
      fajr: 5,
    });

    const fajrNoOffset = noOffset.prayers.find(p => p.name === 'fajr')!;
    const fajrWithOffset = withOffset.prayers.find(p => p.name === 'fajr')!;

    const diffMinutes = (fajrWithOffset.time.getTime() - fajrNoOffset.time.getTime()) / 60000;
    expect(Math.round(diffMinutes)).toBe(5);
  });

  it('should apply negative offset (advance prayer time)', () => {
    const noOffset = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);
    const withOffset = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, {
      ...DEFAULT_OFFSETS,
      maghrib: -3,
    });

    const maghribNoOffset = noOffset.prayers.find(p => p.name === 'maghrib')!;
    const maghribWithOffset = withOffset.prayers.find(p => p.name === 'maghrib')!;

    const diffMinutes = (maghribNoOffset.time.getTime() - maghribWithOffset.time.getTime()) / 60000;
    expect(Math.round(diffMinutes)).toBe(3);
  });
});

describe('Next Prayer Detection', () => {
  it('should return the next upcoming prayer', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const at10am = new Date(2026, 2, 1, 10, 0, 0);
    const next = getNextPrayer(result.prayers, at10am);

    expect(next).not.toBeNull();
    expect(next!.name).toBe('dhuhr');
  });

  it('should return Fajr if queried before Fajr', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const at3am = new Date(2026, 2, 1, 3, 0, 0);
    const next = getNextPrayer(result.prayers, at3am);

    expect(next).not.toBeNull();
    expect(next!.name).toBe('fajr');
  });

  it('should return Asr if queried after Dhuhr', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const dhuhr = result.prayers.find(p => p.name === 'dhuhr')!;
    const afterDhuhr = new Date(dhuhr.time.getTime() + 60000);
    const next = getNextPrayer(result.prayers, afterDhuhr);

    expect(next).not.toBeNull();
    expect(next!.name).toBe('asr');
  });

  it('should return null if all prayers have passed', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const at11pm = new Date(2026, 2, 1, 23, 0, 0);
    const next = getNextPrayer(result.prayers, at11pm);

    expect(next).toBeNull();
  });
});

describe('Next Prayer With Tomorrow Fallback', () => {
  it('should return tomorrow Fajr when all today prayers passed', () => {
    const testDate = new Date(2026, 2, 1);
    const todayPrayers = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const realDateNow = Date.now;
    const late = new Date(2026, 2, 1, 23, 30, 0);
    Date.now = () => late.getTime();

    const realDate = global.Date;
    const OrigDate = global.Date;
    global.Date = class extends OrigDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(late.getTime());
        } else {
          // @ts-ignore
          super(...args);
        }
      }
      static now() { return late.getTime(); }
    } as any;

    const result = getNextPrayerWithTomorrow(
      todayPrayers.prayers,
      RIYADH.lat,
      RIYADH.lng,
      RIYADH.tz,
      DEFAULT_OFFSETS,
    );

    global.Date = realDate;
    Date.now = realDateNow;

    expect(result).not.toBeNull();
    expect(result!.prayer.name).toBe('fajr');
    expect(result!.isTomorrow).toBe(true);
  });
});

describe('Different Locations', () => {
  const testDate = new Date(2026, 2, 1);

  it('should calculate different times for Mecca vs Riyadh', () => {
    const riyadh = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);
    const mecca = calculatePrayerTimes(testDate, MECCA.lat, MECCA.lng, MECCA.tz, DEFAULT_OFFSETS);

    const riyadhFajr = riyadh.prayers.find(p => p.name === 'fajr')!;
    const meccaFajr = mecca.prayers.find(p => p.name === 'fajr')!;

    expect(riyadhFajr.time.getTime()).not.toBe(meccaFajr.time.getTime());
  });

  it('should have all 5 valid prayers for Mecca', () => {
    const result = calculatePrayerTimes(testDate, MECCA.lat, MECCA.lng, MECCA.tz, DEFAULT_OFFSETS);

    expect(result.prayers).toHaveLength(5);
    for (const prayer of result.prayers) {
      expect(isNaN(prayer.time.getTime())).toBe(false);
    }
  });
});

describe('Isha Ramadan Adjustment', () => {
  it('should have Isha = Maghrib + 90 min outside Ramadan (July)', () => {
    const nonRamadanDate = new Date(2026, 6, 1);
    const normal = calculatePrayerTimes(nonRamadanDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const normalMaghrib = normal.prayers.find(p => p.name === 'maghrib')!;
    const normalIsha = normal.prayers.find(p => p.name === 'isha')!;

    const normalDiffMin = Math.round((normalIsha.time.getTime() - normalMaghrib.time.getTime()) / 60000);
    expect(normalDiffMin).toBe(90);
  });
});

describe('Notification Settings Validation', () => {
  it('should respect enabled/disabled prayers for scheduling', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const enabledPrayers: Record<PrayerName, boolean> = {
      fajr: true,
      dhuhr: false,
      asr: true,
      maghrib: false,
      isha: true,
    };

    const schedulablePrayers = result.prayers.filter(p => enabledPrayers[p.name]);
    expect(schedulablePrayers).toHaveLength(3);
    expect(schedulablePrayers.map(p => p.name)).toEqual(['fajr', 'asr', 'isha']);
  });

  it('should skip past prayers when scheduling notifications', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const at2pm = new Date(2026, 2, 1, 14, 0, 0);
    const futurePrayers = result.prayers.filter(p => p.time.getTime() > at2pm.getTime());

    expect(futurePrayers.length).toBeGreaterThan(0);
    expect(futurePrayers.length).toBeLessThan(5);

    for (const prayer of futurePrayers) {
      expect(prayer.time.getTime()).toBeGreaterThan(at2pm.getTime());
    }
  });

  it('should calculate correct seconds until prayer for notification trigger', () => {
    const testDate = new Date(2026, 2, 1);
    const result = calculatePrayerTimes(testDate, RIYADH.lat, RIYADH.lng, RIYADH.tz, DEFAULT_OFFSETS);

    const now = new Date(2026, 2, 1, 10, 0, 0);
    const dhuhr = result.prayers.find(p => p.name === 'dhuhr')!;

    const secondsUntil = Math.floor((dhuhr.time.getTime() - now.getTime()) / 1000);

    expect(secondsUntil).toBeGreaterThan(0);
    expect(secondsUntil).toBeLessThan(4 * 3600);
  });
});
