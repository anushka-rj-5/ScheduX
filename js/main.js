import { initializeCalendar } from './calendar.js';
import { eventService } from './events.js';
import { initializeEventModal } from './modal.js';
import { searchService } from './search.js';
import { storageService } from './storage.js';
import { initializeTheme } from './theme.js';
import { initializeSidebar, showToast } from './ui.js';

document.addEventListener('DOMContentLoaded'), () => {
  let events = storageService.loadEvents();
  let eventModal;
  const searchInput = document.querySelector('[data-event-search]');
  const sidebar = initializeSidebar({
    onCategoryChange: () => refreshSchedule(),
    onEventClick: (eventId) => openEventForEditing(eventId),
  });

  const calendar = initializeCalendar({
  getEvents: () => getVisibleEvents(),
  getHolidays: () => [],
  onEventClick: (eventId) => openEventForEditing(eventId),
});

  initializeTheme();
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
  searchInput?.addEventListener('input', () => refreshSchedule());

  refreshSchedule();

  
    const requestId = ++holidayRequestId;
    calendar.setHolidayError('');
    calendar.setHolidayLoading(true);

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
        calendar.setHolidayLoading(false);
      }
    }
  }

 
 

