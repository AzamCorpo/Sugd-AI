export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export const cityCountryMap: Record<string, { city: string; country: string }> = {
  khujand: { city: 'Khujand', country: 'Tajikistan' },
  dushanbe: { city: 'Dushanbe', country: 'Tajikistan' },
  khorog: { city: 'Khorog', country: 'Tajikistan' },
  samarkand: { city: 'Samarkand', country: 'Uzbekistan' },
  bukhara: { city: 'Bukhara', country: 'Uzbekistan' },
  bishkek: { city: 'Bishkek', country: 'Kyrgyzstan' },
  almaty: { city: 'Almaty', country: 'Kazakhstan' },
  astana: { city: 'Astana', country: 'Kazakhstan' },
  kabul: { city: 'Kabul', country: 'Afghanistan' },
  tehran: { city: 'Tehran', country: 'Iran' },
  isfahan: { city: 'Isfahan', country: 'Iran' },
};

export async function fetchPrayerTimes(cityKey: string): Promise<PrayerTimings | null> {
  const info = cityCountryMap[cityKey];
  if (!info) return null;

  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${info.city}&country=${info.country}&method=3`
    );
    const data = await response.json();
    
    if (data.code === 200) {
      return data.data.timings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
}
