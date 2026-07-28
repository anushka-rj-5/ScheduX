import { HOLIDAY_SETTINGS } from './constants.js';
import { storageService } from './storage.js';

const CALENDARIFIC_URL = 'https://calendarific.com/api/v2/holidays';

/** Loads a country-year holiday set from Calendarific and caches successful responses. */
export const apiService = {
  async getHolidays({ countryCode = HOLIDAY_SETTINGS.countryCode, year }) {
    const cachedHolidays = storageService.loadHolidayCache(countryCode, year);

    if (cachedHolidays && Date.now() - cachedHolidays.cachedAt < HOLIDAY_SETTINGS.cacheDurationMs) {
      return cachedHolidays.holidays;
    }

    const apiKey = document.querySelector('meta[name="calendarific-api-key"]')?.content.trim();

    if (!apiKey) {
      throw new Error('Holiday data is unavailable right now.');
    }

    const query = new URLSearchParams({
      api_key: apiKey,
      country: countryCode,
      year: String(year),
    });
    try {
      const response = await fetch(`${CALENDARIFIC_URL}?${query}`);

      if (!response.ok) {
        throw new Error('Holiday data is unavailable right now.');
      }

      const responseData = await response.json();
      const holidays = responseData.response?.holidays;

      if (!Array.isArray(holidays)) {
        throw new Error('Holiday data is unavailable right now.');
      }

      const normalizedHolidays = holidays.map((holiday, index) => ({
        date: holiday.date.iso,
        description: holiday.description || '',
        id: `${holiday.date.iso}-${index}-${holiday.name}`,
        name: holiday.name,
        type: holiday.type || [],
      }));

      storageService.saveHolidayCache(countryCode, year, normalizedHolidays);
      return normalizedHolidays;
    } catch {
      throw new Error('Holiday data is unavailable right now.');
    }
  },
};
