import { initializeCalendar } from './calendar.js';
import { apiService } from './api.js';
import { HOLIDAY_SETTINGS } from './constants.js';
import { eventService } from './events.js';
import { initializeEventModal } from './modal.js';
import { searchService } from './search.js';
import { storageService } from './storage.js';
import { initializeTheme } from './theme.js';
import { initializeSidebar, showToast } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  let events = storageService.loadEvents();
  let eventModal;
  let holidays = [];
  let holidayRequestId = 0;
  const searchInput = document.querySelector('[data-event-search]');
  const sidebar = initializeSidebar({
    onCategoryChange: () => refreshSchedule(),
    onEventClick: (eventId) => {
        const event = events.find(e => e.id === eventId);

        if (event) {
            eventModal.openEdit(event);
        }
    },
});

  const calendar = initializeCalendar({
    getEvents: () => getVisibleEvents(),
    getHolidays: () => holidays,
    onEventClick: (eventId) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            sidebar.showEventDetails(event);
        }
    },
    onDateSelect: (date) => showEventsForDate(date),
    onMonthChange: (viewDate) => loadHolidays(viewDate),
  });

  initializeTheme();
  loadHolidays(calendar.getViewDate());

  eventModal = initializeEventModal({
    getSelectedDate: () => calendar?.getSelectedDate() ?? '',
    onDelete: (eventId) => {
      events = events.filter((event) => event.id !== eventId);
      storageService.saveEvents(events);
      refreshSchedule();
      showToast('Event deleted.');
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
  loadAnnouncements();

  async function loadHolidays(viewDate) {
    const requestId = ++holidayRequestId;
    calendar.setHolidayError('');
    // calendar.setHolidayLoading(true);

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
    } finally {
      if (requestId === holidayRequestId) {
        //calendar.setHolidayLoading(false);
      }
    }
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
  function openEventForEditing(eventId) {
    const event = events.find(e => e.id === eventId);

    if (!event) return;

    sidebar.showEventDetails(event);
}

  /*async function loadAnnouncements() {
    sidebar?.setAnnouncementsLoading(true);

    try {
      const announcements = await apiService.getAnnouncements();
      sidebar?.renderAnnouncements(announcements);
    } catch (error) {
      sidebar?.setAnnouncementsError(error.message);
    }
  }*/
});
