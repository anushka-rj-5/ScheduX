const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Creates the interactive monthly calendar without seeding any events. */
export function initializeCalendar({
  getEvents = () => [],
  getHolidays = () => [],
  onEventClick = () => {},
  onMonthChange = () => {},
} = {}) {
  const calendarGrid = document.querySelector('[data-calendar-grid]');
  const calendarHeading = document.querySelector('#calendar-heading');
  const calendarControls = document.querySelector('.calendar-controls');
  

  if (!calendarGrid || !calendarHeading || !calendarControls || !holidayLoading || !holidayError) {
    return;
  }

  const today = startOfDay(new Date());
  const state = {
    selectedDate: today,
    today,
    viewDate: new Date(today.getFullYear(), today.getMonth(), 1),
  };

  const renderCalendar = () => {
    const { viewDate } = state;
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const firstVisibleDate = new Date(monthStart);
    firstVisibleDate.setDate(monthStart.getDate() - monthStart.getDay());

    calendarHeading.textContent = monthFormatter.format(viewDate);
    calendarGrid.setAttribute('aria-label', `${monthFormatter.format(viewDate)} calendar`);
    calendarGrid.replaceChildren(...createCalendarCells(firstVisibleDate, state, getEvents(), getHolidays()));
  };

  calendarControls.addEventListener('click', (event) => {
    const action = event.target.closest('[data-calendar-action]')?.dataset.calendarAction;

    if (action === 'today') {
      state.selectedDate = today;
      state.viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
      renderCalendar();
      onMonthChange(new Date(state.viewDate));
    }

    if (action === 'previous' || action === 'next') {
      changeMonth(state, action === 'next' ? 1 : -1);
      renderCalendar();
      onMonthChange(new Date(state.viewDate));
    }
  });

  calendarGrid.addEventListener('click', (event) => {
    const eventChip = event.target.closest('[data-event-id]');

    if (eventChip) {
      onEventClick(eventChip.dataset.eventId);
      return;
    }

    const dayButton = event.target.closest('[data-calendar-date]');

    if (!dayButton) {
      return;
    }

    const selectedDate = parseCalendarDate(dayButton.dataset.calendarDate);
    const previousViewDate = formatMonthKey(state.viewDate);
    state.selectedDate = selectedDate;
    state.viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    renderCalendar();

    if (formatMonthKey(state.viewDate) !== previousViewDate) {
      onMonthChange(new Date(state.viewDate));
    }
  });

  renderCalendar();

  return {
    getSelectedDate: () => formatCalendarDate(state.selectedDate),
    getViewDate: () => new Date(state.viewDate),
    render: renderCalendar,
    setHolidayError: (message) => {
      holidayError.textContent = message;
      holidayError.hidden = !message;
    },
    setHolidayLoading: (isLoading) => {
      holidayLoading.hidden = !isLoading;
    },
  };
}

function createCalendarCells(firstVisibleDate, state, events, holidays) {
  const cells = WEEKDAYS.map((weekday) => {
    const heading = document.createElement('div');
    heading.className = 'weekday';
    heading.textContent = weekday;
    return heading;
  });

  for (let dayOffset = 0; dayOffset < 42; dayOffset += 1) {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + dayOffset);
    cells.push(createDayButton(date, state, events, holidays));
  }

  return cells;
}

function createDayButton(date, state, events, holidays) {
  const dayButton = document.createElement('button');
  const isCurrentMonth = date.getMonth() === state.viewDate.getMonth();
  const isToday = datesMatch(date, state.today);
  const isSelected = datesMatch(date, state.selectedDate);
  const dateKey = formatCalendarDate(date);
  const eventsForDate = events.filter((event) => event.date === dateKey);
  const holidaysForDate = holidays.filter((holiday) => holiday.date === dateKey);

  dayButton.type = 'button';
  dayButton.className = [
    'calendar-day',
    isCurrentMonth ? '' : 'muted',
    holidaysForDate.length ? 'holiday' : '',
    eventsForDate.length ? 'has-events' : '',
    isToday ? 'current' : '',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ');
  dayButton.dataset.calendarDate = dateKey;
  dayButton.setAttribute('aria-label', `${dateFormatter.format(date)}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}${holidaysForDate.length ? `, ${holidaysForDate.length} holiday${holidaysForDate.length === 1 ? '' : 's'}` : ''}${eventsForDate.length ? `, ${eventsForDate.length} event${eventsForDate.length === 1 ? '' : 's'}` : ''}`);

  if (isToday) {
    dayButton.setAttribute('aria-current', 'date');
  }

  const time = document.createElement('time');
  time.dateTime = formatCalendarDate(date);
  time.textContent = String(date.getDate());
  dayButton.append(time);

  if (holidaysForDate.length) {
    const holidayChip = document.createElement('span');
    holidayChip.className = 'holiday-chip';
    holidayChip.textContent = holidaysForDate[0].name;
    dayButton.append(holidayChip);
  }

  eventsForDate.slice(0, 2).forEach((event, index) => {
    const eventChip = document.createElement('span');
    eventChip.className = index === 0 && eventsForDate.length > 1 ? 'event-chip stacked' : 'event-chip';
    eventChip.dataset.eventId = event.id;
    eventChip.style.setProperty('--event-color', event.color);
    eventChip.textContent = event.title;
    dayButton.append(eventChip);
  });

  if (eventsForDate.length > 2) {
    const moreEvents = document.createElement('span');
    moreEvents.className = 'event-chip more-events';
    moreEvents.textContent = `+${eventsForDate.length - 2}`;
    dayButton.append(moreEvents);
  }

  return dayButton;
}

function changeMonth(state, monthOffset) {
  const currentDay = state.selectedDate.getDate();
  const nextViewDate = new Date(
    state.viewDate.getFullYear(),
    state.viewDate.getMonth() + monthOffset,
    1,
  );
  const lastDayOfNextMonth = new Date(
    nextViewDate.getFullYear(),
    nextViewDate.getMonth() + 1,
    0,
  ).getDate();

  state.viewDate = nextViewDate;
  state.selectedDate = new Date(
    nextViewDate.getFullYear(),
    nextViewDate.getMonth(),
    Math.min(currentDay, lastDayOfNextMonth),
  );
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function datesMatch(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function formatCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}
