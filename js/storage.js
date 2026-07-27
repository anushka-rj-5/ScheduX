const EVENTS_STORAGE_KEY = 'schedux-events';
const HOLIDAY_CACHE_PREFIX = 'schedux-holidays';
const PREFERENCES_STORAGE_KEY = 'schedux-preferences';

/** Persists only valid local event arrays and recovers safely from malformed data. */
export const storageService = {
  loadEvents() {
    try {
      const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
      const parsedEvents = storedEvents ? JSON.parse(storedEvents) : [];
      return Array.isArray(parsedEvents) ? parsedEvents : [];
    } catch {
      return [];
    }
  },

  saveEvents(events) {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      return true;
    } catch {
      return false;
    }
  },

  loadHolidayCache(countryCode, year) {
    try {
      const cachedValue = localStorage.getItem(getHolidayCacheKey(countryCode, year));
      const cache = cachedValue ? JSON.parse(cachedValue) : null;
      return cache?.holidays && Array.isArray(cache.holidays) ? cache : null;
    } catch {
      return null;
    }
  },

  saveHolidayCache(countryCode, year, holidays) {
    try {
      localStorage.setItem(getHolidayCacheKey(countryCode, year), JSON.stringify({
        cachedAt: Date.now(),
        holidays,
      }));
      return true;
    } catch {
      return false;
    }
  },

  loadPreference(key, fallbackValue) {
    try {
      const preferences = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}');
      return preferences[key] ?? fallbackValue;
    } catch {
      return fallbackValue;
    }
  },

  savePreference(key, value) {
    try {
      const preferences = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}');
      preferences[key] = value;
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      return true;
    } catch {
      return false;
    }
  },
};

function getHolidayCacheKey(countryCode, year) {
  return `${HOLIDAY_CACHE_PREFIX}:${countryCode}:${year}`;
}
