import { initializeCalendar } from './calendar.js';
import { apiService } from './api.js';
import { HOLIDAY_SETTINGS } from './constants.js';
import { eventService } from './events.js';
import { initializeEventModal } from './modal.js';
import { searchService } from './search.js';
import { storageService } from './storage.js';
import { initializeTheme } from './theme.js';
import { initializeSidebar, showToast, showEventDetailPopup } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  let events = storageService.loadEvents();
  let eventModal;
  let holidays = [];
  let holidayRequestId = 0;
  const searchInput = document.querySelector('[data-event-search]');

  const handleSelectEvent = (event) => {
    if (!event) return;
    calendar?.navigateToDate(event.date);
    sidebar?.showEventDetails(event);
    showEventDetailPopup(event, {
      onEdit: (evt) => {
        eventModal.openEdit(evt);
      },
      onDelete: (id) => {
        return deleteEvent(id);
      },
    });
  };

  const sidebar = initializeSidebar({
    onCategoryChange: () => refreshSchedule(),
    onEventClick: (eventId) => {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        handleSelectEvent(event);
      }
    },
  });

  const calendar = initializeCalendar({
    getEvents: () => getVisibleEvents(),
    getHolidays: () => holidays,

    // Left-click / tap on a user event → open detail popup with Edit & Delete
    onEventClick: (eventId) => {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        handleSelectEvent(event);
      }
    },

    // Context menu / long-press → Edit shortcut
    onEventEdit: (eventId) => {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        eventModal.openEdit(event);
      }
    },

    // Context menu / long-press → Delete shortcut
    onEventDelete: (eventId) => {
      deleteEvent(eventId);
    },

    onDateSelect: (date) => showEventsForDate(date),
    onMonthChange: (viewDate) => loadHolidays(viewDate),
  });

  initializeTheme();
  loadHolidays(calendar.getViewDate());

  eventModal = initializeEventModal({
    getSelectedDate: () => calendar?.getSelectedDate() ?? '',
    onDelete: (eventId) => {
      deleteEvent(eventId);
    },
    onSave: (draft, eventId) => {
      const validationMessage = eventService.validateEvent(draft, events, eventId);

      if (validationMessage) {
        return { error: validationMessage };
      }

      if (eventId) {
        events = events.map((event) => (
          event.id === eventId ? eventService.updateEvent(event, draft) : event
        ));
      } else {
        events = [...events, eventService.createEvent(draft)];
      }

      storageService.saveEvents(events);
      refreshSchedule();
      showToast(eventId ? 'Event updated.' : 'Event created.');
      return {};
    },
  });

  document.querySelector('.add-event-button')?.addEventListener('click', () => {
    eventModal?.openCreate();
  });
  searchInput?.addEventListener("input", () => {
    refreshSchedule();
    calendar.render();
  });
  refreshSchedule();

  async function loadHolidays(viewDate) {
    const requestId = ++holidayRequestId;
    calendar.setHolidayError('');

    try {
      const loadedHolidays = await apiService.getHolidays({
        countryCode: HOLIDAY_SETTINGS.countryCode,
        year: viewDate.getFullYear(),
      });

      if (requestId === holidayRequestId) {
        holidays = loadedHolidays;
        calendar.render();
      }
    } catch (error) {
      if (requestId === holidayRequestId) {
        holidays = [];
        calendar.render();
        calendar.setHolidayError(error.message);
      }
    }
  }

  function deleteEvent(eventId) {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return false;

    if (!window.confirm(`Delete "${targetEvent.title}"?`)) {
      return false;
    }

    events = events.filter((event) => event.id !== eventId);
    storageService.saveEvents(events);
    refreshSchedule();
    sidebar?.clearEventDetails();
    showToast('Event deleted.');
    return true;
  }

  function getVisibleEvents() {
    return searchService.filterEvents(events, {
        categories: sidebar?.getSelectedCategories() ?? [],
        query: searchInput?.value ?? ""
    });
  }

  function showEventsForDate(date) {

    const event = getVisibleEvents().find(e => e.date === date);

    if (event) {
        sidebar.showEventDetails(event);
    } else {
        sidebar.clearEventDetails();
    }
  }

  function refreshSchedule() {
    const visibleEvents = getVisibleEvents();
    sidebar?.render({ allEvents: events, visibleEvents });
    calendar?.render();
  }
});
