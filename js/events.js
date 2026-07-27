import { CATEGORIES, DEFAULT_EVENT_COLOR } from './constants.js';

/** Validates, normalizes, and creates records for user-owned calendar events. */
export const eventService = {
  createEvent(draft) {
    const normalizedEvent = normalizeEvent(draft);
    const timestamp = new Date().toISOString();

    return {
      ...normalizedEvent,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  },

  updateEvent(event, draft) {
    return {
      ...event,
      ...normalizeEvent(draft),
      updatedAt: new Date().toISOString(),
    };
  },

  validateEvent(draft, existingEvents, editedEventId) {
    const normalizedEvent = normalizeEvent(draft);

    if (!normalizedEvent.title) {
      return 'Add a title for your event.';
    }

    if (!isValidDate(normalizedEvent.date)) {
      return 'Choose a valid date for your event.';
    }

    if (!CATEGORIES.includes(normalizedEvent.category)) {
      return 'Choose a valid event category.';
    }

    if (!isValidTime(normalizedEvent.time)) {
      return 'Choose a valid time, or leave it empty for an all-day event.';
    }

    if (hasOverlap(normalizedEvent, existingEvents, editedEventId)) {
      return normalizedEvent.time
        ? `Another event already occupies ${normalizedEvent.time} on this date.`
        : 'An all-day event already occupies this date.';
    }

    return '';
  },
};

function normalizeEvent(draft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    date: draft.date,
    time: draft.time,
    category: draft.category,
    color: draft.color || DEFAULT_EVENT_COLOR,
  };
}

function hasOverlap(draft, existingEvents, editedEventId) {
  return existingEvents.some((event) => {
    if (event.id === editedEventId || event.date !== draft.date) {
      return false;
    }

    return !event.time || !draft.time || event.time === draft.time;
  });
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTime(value) {
  return !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
