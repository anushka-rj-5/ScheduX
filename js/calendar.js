import {
  showHolidayPopover,
  hideHolidayPopover,
  showEventPreviewTooltip,
  hideEventPreviewTooltip,
  showContextMenu,
  hideContextMenu,
} from './ui.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const LONG_PRESS_MS = 500;

/** Creates the interactive monthly calendar without seeding any events. */
export function initializeCalendar({
  getEvents = () => [],
  getHolidays = () => [],
  onEventClick = () => {},
  onEventEdit = () => {},
  onEventDelete = () => {},
  onDateSelect = () => {},
  onMonthChange = () => {},
} = {}) {
  const calendarGrid = document.querySelector('[data-calendar-grid]');
  const calendarHeading = document.querySelector('#calendar-heading');
  const calendarControls = document.querySelector('.calendar-controls');
  const holidayError = document.querySelector('[data-calendar-error]');
  const monthBtn = document.querySelector('[data-calendar-month-btn]');
  const yearBtn = document.querySelector('[data-calendar-year-btn]');
  const monthLabel = document.querySelector('[data-calendar-month-label]');
  const yearLabel = document.querySelector('[data-calendar-year-label]');
  const calendarBody = document.querySelector('.calendar-body');

  if (!calendarGrid || !calendarControls || !holidayError) {
    return;
  }

  const today = startOfDay(new Date());
  const state = {
    selectedDate: today,
    today,
    viewDate: new Date(today.getFullYear(), today.getMonth(), 1),
    decadeStartYear: Math.floor(today.getFullYear() / 10) * 10,
  };

  // Active pickers tracking
  let activeMonthPicker = null;
  let activeYearPicker = null;
  let isAnimating = false;

  // Touch & Long-press tracking
  let longPressTimer = null;
  let longPressTriggered = false;

  const updateHeaderLabels = () => {
    const { viewDate } = state;
    const currentMonthName = MONTH_NAMES[viewDate.getMonth()];
    const currentYearStr = String(viewDate.getFullYear());

    if (calendarHeading) {
      calendarHeading.textContent = monthFormatter.format(viewDate);
    }
    if (monthLabel) {
      monthLabel.textContent = currentMonthName;
    }
    if (yearLabel) {
      yearLabel.textContent = currentYearStr;
    }
  };

  const renderCalendar = (transitionType = 'none') => {
    updateHeaderLabels();

    const { viewDate } = state;
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const firstVisibleDate = new Date(monthStart);
    firstVisibleDate.setDate(monthStart.getDate() - monthStart.getDay());

    calendarGrid.setAttribute('aria-label', `${monthFormatter.format(viewDate)} calendar`);

    // Handle transitions
    if (transitionType === 'next' || transitionType === 'previous') {
      executePageTurnAnimation(transitionType, () => {
        calendarGrid.replaceChildren(...createCalendarCells(firstVisibleDate, state, getEvents(), getHolidays()));
      });
    } else if (transitionType === 'fade') {
      calendarGrid.replaceChildren(...createCalendarCells(firstVisibleDate, state, getEvents(), getHolidays()));
      calendarGrid.classList.remove('calendar-grid-fade');
      // Trigger reflow to restart fade
      void calendarGrid.offsetWidth;
      calendarGrid.classList.add('calendar-grid-fade');
    } else {
      calendarGrid.replaceChildren(...createCalendarCells(firstVisibleDate, state, getEvents(), getHolidays()));
    }
  };

  const executePageTurnAnimation = (direction, updateDOMCallback) => {
    if (!calendarBody || isAnimating) {
      updateDOMCallback();
      return;
    }

    isAnimating = true;

    // Clone current grid for exiting animation
    const exitGrid = calendarGrid.cloneNode(true);
    exitGrid.removeAttribute('id');
    exitGrid.classList.add('calendar-grid-animating-exit');
    exitGrid.style.animationName = direction === 'next' ? 'pageTurnExitLeft' : 'pageTurnExitRight';

    calendarBody.appendChild(exitGrid);

    // Update main grid DOM for new month
    updateDOMCallback();

    calendarGrid.classList.add('calendar-grid-animating-enter');
    calendarGrid.style.animationName = direction === 'next' ? 'pageTurnEnterRight' : 'pageTurnEnterLeft';

    setTimeout(() => {
      exitGrid.remove();
      calendarGrid.classList.remove('calendar-grid-animating-enter');
      calendarGrid.style.animationName = '';
      isAnimating = false;
    }, 450);
  };

  /* ── Header Controls Event Listener ───────────── */

  document.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-calendar-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.calendarAction;

    if (action === 'today') {
      closeAllPickers();
      state.selectedDate = today;
      state.viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
      renderCalendar('fade');
      onMonthChange(new Date(state.viewDate));
    }

    if (action === 'previous' || action === 'next') {
      closeAllPickers();
      changeMonth(state, action === 'next' ? 1 : -1);
      renderCalendar(action);
      onMonthChange(new Date(state.viewDate));
    }
  });

  /* ── Month Dropdown Picker ────────────────────── */

  monthBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeMonthPicker) {
      closeAllPickers();
    } else {
      closeAllPickers();
      openMonthPicker();
    }
  });

  function openMonthPicker() {
    monthBtn?.setAttribute('aria-expanded', 'true');

    const dropdown = document.createElement('div');
    dropdown.className = 'month-picker-dropdown';

    const grid = document.createElement('div');
    grid.className = 'month-picker-grid';

    MONTH_NAMES.forEach((name, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'month-picker-btn' + (index === state.viewDate.getMonth() ? ' active' : '');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        closeAllPickers();
        state.viewDate = new Date(state.viewDate.getFullYear(), index, 1);
        renderCalendar('fade');
        onMonthChange(new Date(state.viewDate));
      });
      grid.append(btn);
    });

    dropdown.append(grid);
    document.body.append(dropdown);
    activeMonthPicker = dropdown;

    positionDropdown(dropdown, monthBtn);
  }

  /* ── Year Dropdown Picker ─────────────────────── */

  yearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeYearPicker) {
      closeAllPickers();
    } else {
      closeAllPickers();
      openYearPicker();
    }
  });

  function openYearPicker() {
    yearBtn?.setAttribute('aria-expanded', 'true');

    const dropdown = document.createElement('div');
    dropdown.className = 'year-picker-dropdown';

    renderYearPickerContent(dropdown);

    document.body.append(dropdown);
    activeYearPicker = dropdown;

    positionDropdown(dropdown, yearBtn);
  }

  function renderYearPickerContent(container) {
    container.replaceChildren();

    const decadeStart = state.decadeStartYear;
    const decadeEnd = decadeStart + 9;

    // Header with decade range & arrows
    const header = document.createElement('div');
    header.className = 'year-picker-header';

    const prevDecadeBtn = document.createElement('button');
    prevDecadeBtn.type = 'button';
    prevDecadeBtn.className = 'icon-button-subtle';
    prevDecadeBtn.setAttribute('aria-label', 'Previous decade');
    prevDecadeBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevDecadeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.decadeStartYear -= 10;
      renderYearPickerContent(container);
    });

    const title = document.createElement('span');
    title.className = 'year-picker-decade-title';
    title.textContent = `${decadeStart}–${decadeEnd}`;

    const nextDecadeBtn = document.createElement('button');
    nextDecadeBtn.type = 'button';
    nextDecadeBtn.className = 'icon-button-subtle';
    nextDecadeBtn.setAttribute('aria-label', 'Next decade');
    nextDecadeBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextDecadeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.decadeStartYear += 10;
      renderYearPickerContent(container);
    });

    header.append(prevDecadeBtn, title, nextDecadeBtn);

    // 3x3 Grid of years
    const grid = document.createElement('div');
    grid.className = 'year-picker-grid';

    for (let yr = decadeStart; yr <= decadeEnd; yr += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'year-picker-btn' + (yr === state.viewDate.getFullYear() ? ' active' : '');
      btn.textContent = String(yr);
      btn.addEventListener('click', () => {
        closeAllPickers();
        state.viewDate = new Date(yr, state.viewDate.getMonth(), 1);
        renderCalendar('fade');
        onMonthChange(new Date(state.viewDate));
      });
      grid.append(btn);
    }

    container.append(header, grid);
  }

  function closeAllPickers() {
    monthBtn?.setAttribute('aria-expanded', 'false');
    yearBtn?.setAttribute('aria-expanded', 'false');
    if (activeMonthPicker) {
      activeMonthPicker.remove();
      activeMonthPicker = null;
    }
    if (activeYearPicker) {
      activeYearPicker.remove();
      activeYearPicker = null;
    }
  }

  // Close pickers on outside click or Escape
  document.addEventListener('click', (e) => {
    if (activeMonthPicker && !activeMonthPicker.contains(e.target) && !monthBtn?.contains(e.target)) {
      closeAllPickers();
    }
    if (activeYearPicker && !activeYearPicker.contains(e.target) && !yearBtn?.contains(e.target)) {
      closeAllPickers();
    }
  });

  /* ── Desktop Hover Interactions (mouseover / mouseout) ──── */

  calendarGrid.addEventListener('mouseover', (event) => {
    // 1. Holiday Chip Hover
    const holidayChip = event.target.closest('.holiday-chip');
    if (holidayChip) {
      if (event.relatedTarget && holidayChip.contains(event.relatedTarget)) return;
      const dateKey = holidayChip.dataset.holidayDate;
      const holidays = getHolidays().filter((h) => h.date === dateKey);
      if (holidays.length) {
        showHolidayPopover(holidays, holidayChip);
      }
      return;
    }

    // 2. User Event Chip Hover
    const eventChip = event.target.closest('[data-event-id]');
    if (eventChip) {
      if (event.relatedTarget && eventChip.contains(event.relatedTarget)) return;
      const eventData = getEvents().find((e) => e.id === eventChip.dataset.eventId);
      if (eventData) {
        showEventPreviewTooltip(eventData, eventChip);
      }
      return;
    }
  });

  calendarGrid.addEventListener('mouseout', (event) => {
    // 1. Holiday Chip Mouse Out
    const holidayChip = event.target.closest('.holiday-chip');
    if (holidayChip) {
      if (event.relatedTarget && holidayChip.contains(event.relatedTarget)) return;
      hideHolidayPopover();
      return;
    }

    // 2. User Event Chip Mouse Out
    const eventChip = event.target.closest('[data-event-id]');
    if (eventChip) {
      if (event.relatedTarget && eventChip.contains(event.relatedTarget)) return;
      hideEventPreviewTooltip();
      return;
    }
  });

  /* ── Click handling (Desktop left click & Mobile tap) ───── */

  calendarGrid.addEventListener('click', (event) => {
    if (longPressTriggered) {
      longPressTriggered = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    closeAllPickers();

    /* 1. Holiday Chip Click/Tap */
    const holidayChip = event.target.closest('.holiday-chip');
    if (holidayChip) {
      const dateKey = holidayChip.dataset.holidayDate;
      const holidays = getHolidays().filter((h) => h.date === dateKey);
      if (holidays.length) {
        showHolidayPopover(holidays, holidayChip);
      }
      return;
    }

    /* 2. User Event Chip Click/Tap */
    const eventChip = event.target.closest('[data-event-id]');
    if (eventChip) {
      hideEventPreviewTooltip();
      onEventClick(eventChip.dataset.eventId);
      return;
    }

    /* 3. Day cell — select date */
    const dayButton = event.target.closest('[data-calendar-date]');
    if (!dayButton) return;

    const selectedDate = parseCalendarDate(dayButton.dataset.calendarDate);
    const previousViewDate = formatMonthKey(state.viewDate);

    state.selectedDate = selectedDate;
    state.viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

    renderCalendar();
    onDateSelect(dayButton.dataset.calendarDate);

    if (formatMonthKey(state.viewDate) !== previousViewDate) {
      onMonthChange(new Date(state.viewDate));
    }
  });

  /* ── Right-click context menu (desktop) ──────────── */

  calendarGrid.addEventListener('contextmenu', (event) => {
    const eventChip = event.target.closest('[data-event-id]');
    if (!eventChip) return;

    event.preventDefault();
    hideEventPreviewTooltip();

    const eventId = eventChip.dataset.eventId;
    showContextMenu(event.clientX, event.clientY, {
      onEdit: () => onEventEdit(eventId),
      onDelete: () => onEventDelete(eventId),
    });
  });

  /* ── Long-press context menu (mobile) ────────────── */

  calendarGrid.addEventListener('touchstart', (event) => {
    const eventChip = event.target.closest('[data-event-id]');
    if (!eventChip) return;

    longPressTriggered = false;

    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      const touch = event.touches[0];
      const eventId = eventChip.dataset.eventId;

      showContextMenu(touch.clientX, touch.clientY, {
        onEdit: () => onEventEdit(eventId),
        onDelete: () => onEventDelete(eventId),
      });
    }, LONG_PRESS_MS);
  }, { passive: true });

  calendarGrid.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  }, { passive: true });

  calendarGrid.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
  }, { passive: true });

  /* ── Global keydown Escape listener ──────────────── */

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllPickers();
      hideHolidayPopover();
      hideContextMenu();
      hideEventPreviewTooltip();
    }
  });

  renderCalendar();

  return {
    getSelectedDate: () => formatCalendarDate(state.selectedDate),
    getViewDate: () => new Date(state.viewDate),
    render: renderCalendar,
    navigateToDate: (dateValue) => {
      const date = parseCalendarDate(dateValue);
      const previousViewDate = formatMonthKey(state.viewDate);

      state.selectedDate = date;
      state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
      state.decadeStartYear = Math.floor(date.getFullYear() / 10) * 10;

      closeAllPickers();
      renderCalendar('fade');

      if (formatMonthKey(state.viewDate) !== previousViewDate) {
        onMonthChange(new Date(state.viewDate));
      }
    },
    setHolidayError: (message) => {
      holidayError.textContent = message;
      holidayError.hidden = !message;
    },
  };
}

function positionDropdown(element, anchor) {
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  let top = rect.bottom + 6;
  let left = rect.left;

  // Clamp horizontally
  const width = 260;
  if (left + width > window.innerWidth - 12) {
    left = window.innerWidth - width - 12;
  }
  left = Math.max(12, left);

  element.style.top = top + 'px';
  element.style.left = left + 'px';
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

  // Render every holiday as its own separate vertically stacked chip
  if (holidaysForDate.length > 0) {
    const holidayContainer = document.createElement('div');
    holidayContainer.className = 'holiday-chips-container';

    holidaysForDate.forEach((holiday) => {
      const holidayChip = document.createElement('span');
      holidayChip.className = 'holiday-chip';
      holidayChip.textContent = holiday.name;
      holidayChip.dataset.holidayDate = dateKey;
      holidayChip.setAttribute('tabindex', '0');
      holidayChip.setAttribute('aria-label', holiday.name);
      holidayContainer.append(holidayChip);
    });

    dayButton.append(holidayContainer);
  }

  // Render user event chips
  if (eventsForDate.length > 0) {
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'events-container';

    eventsForDate.slice(0, 2).forEach((event) => {
      const eventChip = document.createElement('span');
      eventChip.className = 'event-chip';
      eventChip.dataset.eventId = event.id;
      eventChip.style.setProperty('--event-color', event.color);
      eventChip.textContent = event.title;
      eventsContainer.append(eventChip);
    });

    if (eventsForDate.length > 2) {
      const moreEvents = document.createElement('span');
      moreEvents.className = 'event-chip more-events';
      moreEvents.textContent = `+${eventsForDate.length - 2}`;
      eventsContainer.append(moreEvents);
    }

    dayButton.append(eventsContainer);
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
  state.decadeStartYear = Math.floor(state.viewDate.getFullYear() / 10) * 10;
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
