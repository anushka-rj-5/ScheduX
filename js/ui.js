import { CATEGORIES, CATEGORY_COLORS } from './constants.js';

const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/* Renders dynamic sidebar content and exposes category filter state. */
export function initializeSidebar({ onCategoryChange = () => {}, onEventClick = () => {} } = {}) {
  const todayDate = document.querySelector('[data-today-date]');
  const todayEvents = document.querySelector('[data-today-events]');
  const upcomingEvents = document.querySelector('[data-upcoming-events]');
  const categoryFilters = document.querySelector('[data-category-filters]');
  const categoryToggleAll = document.querySelector('[data-category-toggle-all]');
  const eventDetails = document.querySelector('[data-event-details]');
  const allEventsToggle = document.querySelector('[data-all-events-toggle]');
  const allEventsContainer = document.querySelector('[data-all-events-container]');
  const allEventsList = document.querySelector('[data-all-events-list]');
  const allEventsToggleBtn = document.querySelector('.all-events-toggle-btn');
  const allEventsSearch = document.querySelector('[data-all-events-search]');
  const allEventsYearFilter = document.querySelector('[data-all-events-year-filter]');
  const allEventsMonthFilter = document.querySelector('[data-all-events-month-filter]');

  const selectedCategories = new Set(CATEGORIES);
  const allEventsFilterState = { query: '', year: 'all', month: 'all' };
  let cachedAllEvents = [];

  if (!todayDate || !todayEvents || !upcomingEvents || !categoryFilters || !eventDetails) {
    return null;
  }

  // Toggle single category
  categoryFilters.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-category]');

    if (!filterButton) {
      return;
    }

    const { category } = filterButton.dataset;

    if (selectedCategories.has(category)) {
      selectedCategories.delete(category);
    } else {
      selectedCategories.add(category);
    }

    onCategoryChange([...selectedCategories]);
  });

  // Toggle Select All / Deselect All
  categoryToggleAll?.addEventListener('click', () => {
    if (selectedCategories.size === CATEGORIES.length) {
      selectedCategories.clear();
    } else {
      CATEGORIES.forEach((category) => selectedCategories.add(category));
    }

    onCategoryChange([...selectedCategories]);
  });

  // Collapsible All Events Card
  allEventsToggle?.addEventListener('click', () => {
    const isHidden = allEventsContainer?.hasAttribute('hidden');
    if (isHidden) {
      allEventsContainer?.removeAttribute('hidden');
      allEventsToggleBtn?.setAttribute('aria-expanded', 'true');
    } else {
      allEventsContainer?.setAttribute('hidden', '');
      allEventsToggleBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  // All Events Search & Filters
  allEventsSearch?.addEventListener('input', (e) => {
    allEventsFilterState.query = e.target.value;
    if (allEventsList) {
      renderAllEventsList(allEventsList, cachedAllEvents, allEventsFilterState);
    }
  });

  allEventsYearFilter?.addEventListener('change', (e) => {
    allEventsFilterState.year = e.target.value;
    if (allEventsList) {
      renderAllEventsList(allEventsList, cachedAllEvents, allEventsFilterState);
    }
  });

  allEventsMonthFilter?.addEventListener('change', (e) => {
    allEventsFilterState.month = e.target.value;
    if (allEventsList) {
      renderAllEventsList(allEventsList, cachedAllEvents, allEventsFilterState);
    }
  });

  // Sidebar event clicks (Today, Upcoming, All Events)
  [todayEvents, upcomingEvents, allEventsList].forEach((container) => {
    container?.addEventListener('click', (event) => {
      const eventButton = event.target.closest('[data-sidebar-event-id]');

      if (eventButton) {
        onEventClick(eventButton.dataset.sidebarEventId);
      }
    });
  });

  return {
    getSelectedCategories: () => [...selectedCategories],

    render({ allEvents, visibleEvents }) {
        cachedAllEvents = allEvents;
        const today = new Date();
        const todayKey = formatDateKey(today);

        todayDate.textContent = dayFormatter.format(today);

        renderEventList(
            todayEvents,
            visibleEvents.filter((event) => event.date === todayKey),
            'No events scheduled today.'
        );

        renderEventList(
            upcomingEvents,
            getUpcomingEvents(visibleEvents),
            'No upcoming events yet.'
        );

        renderCategoryFilters(categoryFilters, categoryToggleAll, allEvents, selectedCategories);

        if (allEventsYearFilter) {
          updateAllEventsYearOptions(allEventsYearFilter, allEvents, allEventsFilterState.year);
        }

        if (allEventsList) {
          renderAllEventsList(allEventsList, allEvents, allEventsFilterState);
        }
    },

   showEventDetails(event) {

    eventDetails.replaceChildren();

    // Card
    const card = document.createElement("div");
    card.className = "event-detail-card";
    
    // Header
    const header = document.createElement("div");
    header.className = "event-detail-header";

    const colorDot = document.createElement("span");
    colorDot.className = "event-color";
    colorDot.style.background = event.color;

    const titleSection = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = event.title;

    const category = document.createElement("span");
    category.className = "event-category";
    category.textContent = event.category;

    titleSection.append(title, category);

    header.append(colorDot, titleSection);

    // Date Row
    const dateRow = document.createElement("div");
    dateRow.className = "event-info";

    const dateIcon = document.createElement("i");
    dateIcon.className = "fa-regular fa-calendar";

    const dateText = document.createElement("span");
    dateText.textContent = event.date;

    dateRow.append(dateIcon, dateText);

    // Time Row
    const timeRow = document.createElement("div");
    timeRow.className = "event-info";

    const timeIcon = document.createElement("i");
    timeIcon.className = "fa-regular fa-clock";

    const timeText = document.createElement("span");
    timeText.textContent = event.time || "All Day";

    timeRow.append(timeIcon, timeText);

    // Description
    const description = document.createElement("div");
    description.className = "event-description";
    description.textContent =
        event.description || "No description available.";

    // Build Card
    card.append(
        header,
        dateRow,
        timeRow,
        description
    );

    eventDetails.append(card);
},

   clearEventDetails() {
    eventDetails.replaceChildren();
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-copy';
    emptyState.textContent = 'Select an event from the calendar.';
    eventDetails.append(emptyState);
   },
 };
}

/** Displays a brief, non-blocking confirmation after user actions. */
export function showToast(message) {
  const toastRegion = document.querySelector('.toast-region');

  if (!toastRegion) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastRegion.append(toast);

  window.setTimeout(() => toast.remove(), 3600);
}

/* ─── Holiday Popover ───────────────────────── */

let activeHolidayPopover = null;

export function showHolidayPopover(holidays, anchorEl) {
  hideHolidayPopover();

  const popover = document.createElement('div');
  popover.className = 'holiday-popover';

  // Close button (visible on mobile via CSS)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'holiday-popover-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideHolidayPopover();
  });
  popover.append(closeBtn);

  holidays.forEach((holiday, index) => {
    if (index > 0) {
      const divider = document.createElement('hr');
      divider.style.cssText = 'border:0;border-top:1px solid var(--border);margin:.6rem 0';
      popover.append(divider);
    }

    const name = document.createElement('p');
    name.className = 'holiday-popover-name';
    name.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i>';
    name.append(document.createTextNode(holiday.name));

    const dateBadge = document.createElement('span');
    dateBadge.className = 'holiday-popover-date';
    dateBadge.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i>';
    const dateObj = parseLocalDate(holiday.date);
    dateBadge.append(document.createTextNode(fullDateFormatter.format(dateObj)));

    popover.append(name, dateBadge);

    if (holiday.description) {
      const desc = document.createElement('p');
      desc.className = 'holiday-popover-desc';
      desc.textContent = holiday.description;
      popover.append(desc);
    }
  });

  document.body.append(popover);
  activeHolidayPopover = popover;

  positionPopover(popover, anchorEl);

  requestAnimationFrame(() => {
    const handleOutsideClick = (e) => {
      if (activeHolidayPopover && !activeHolidayPopover.contains(e.target) && !anchorEl.contains(e.target)) {
        hideHolidayPopover();
        document.removeEventListener('click', handleOutsideClick, true);
        document.removeEventListener('touchstart', handleOutsideClick, true);
      }
    };
    document.addEventListener('click', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);
  });
}

export function hideHolidayPopover() {
  if (activeHolidayPopover) {
    activeHolidayPopover.remove();
    activeHolidayPopover = null;
  }
}

export function isHolidayPopoverOpen() {
  return activeHolidayPopover !== null;
}

/* ─── Event Preview Tooltip (desktop hover) ── */

let activePreviewTooltip = null;

export function showEventPreviewTooltip(event, anchorEl) {
  hideEventPreviewTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'event-preview-tooltip';

  const title = document.createElement('span');
  title.className = 'event-preview-tooltip-title';
  title.textContent = event.title;

  const meta = document.createElement('span');
  meta.className = 'event-preview-tooltip-meta';
  meta.textContent = `${event.time || 'All day'} \u00B7 ${event.category}`;

  tooltip.append(title, meta);
  document.body.append(tooltip);
  activePreviewTooltip = tooltip;

  positionPopover(tooltip, anchorEl);
}

export function hideEventPreviewTooltip() {
  if (activePreviewTooltip) {
    activePreviewTooltip.remove();
    activePreviewTooltip = null;
  }
}

/* ─── Event Detail Popup ────────────────────── */

let activeDetailPopup = null;
let activeDetailBackdrop = null;

export function showEventDetailPopup(event, { onEdit, onDelete }) {
  hideEventDetailPopup();

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'event-detail-popup-backdrop';
  backdrop.addEventListener('click', hideEventDetailPopup);

  // Popup
  const popup = document.createElement('div');
  popup.className = 'event-detail-popup';

  // Header
  const header = document.createElement('div');
  header.className = 'event-detail-popup-header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'event-detail-popup-header-left';

  const colorDot = document.createElement('span');
  colorDot.className = 'event-detail-popup-color';
  colorDot.style.background = event.color;

  const title = document.createElement('h3');
  title.className = 'event-detail-popup-title';
  title.textContent = event.title;

  headerLeft.append(colorDot, title);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'event-detail-popup-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
  closeBtn.addEventListener('click', hideEventDetailPopup);

  header.append(headerLeft, closeBtn);

  // Category badge
  const category = document.createElement('span');
  category.className = 'event-detail-popup-category';
  category.textContent = event.category;

  // Date row
  const dateRow = document.createElement('div');
  dateRow.className = 'event-detail-popup-row';
  const dateIcon = document.createElement('i');
  dateIcon.className = 'fa-regular fa-calendar';
  const dateText = document.createElement('span');
  const dateObj = parseLocalDate(event.date);
  dateText.textContent = fullDateFormatter.format(dateObj);
  dateRow.append(dateIcon, dateText);

  // Time row
  const timeRow = document.createElement('div');
  timeRow.className = 'event-detail-popup-row';
  const timeIcon = document.createElement('i');
  timeIcon.className = 'fa-regular fa-clock';
  const timeText = document.createElement('span');
  timeText.textContent = event.time || 'All Day';
  timeRow.append(timeIcon, timeText);

  // Description
  const desc = document.createElement('div');
  desc.className = 'event-detail-popup-desc';
  desc.textContent = event.description || 'No description available.';

  // Actions
  const actions = document.createElement('div');
  actions.className = 'event-detail-popup-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'event-detail-popup-edit';
  editBtn.type = 'button';
  editBtn.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i> Edit';
  editBtn.addEventListener('click', () => {
    hideEventDetailPopup();
    onEdit(event);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'event-detail-popup-delete';
  deleteBtn.type = 'button';
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i> Delete';
  deleteBtn.addEventListener('click', () => {
    const res = onDelete(event.id);
    if (res !== false) {
      hideEventDetailPopup();
    }
  });

  actions.append(editBtn, deleteBtn);

  popup.append(header, category, dateRow, timeRow, desc, actions);

  document.body.append(backdrop, popup);
  activeDetailBackdrop = backdrop;
  activeDetailPopup = popup;

  // Trap escape
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      hideEventDetailPopup();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

export function hideEventDetailPopup() {
  if (activeDetailBackdrop) {
    activeDetailBackdrop.remove();
    activeDetailBackdrop = null;
  }
  if (activeDetailPopup) {
    activeDetailPopup.remove();
    activeDetailPopup = null;
  }
}

/* ─── Context Menu ──────────────────────────── */

let activeContextMenu = null;

export function showContextMenu(x, y, { onEdit, onDelete }) {
  hideContextMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  const editItem = document.createElement('button');
  editItem.className = 'context-menu-item';
  editItem.type = 'button';
  editItem.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i> Edit Event';
  editItem.addEventListener('click', () => {
    hideContextMenu();
    onEdit();
  });

  const deleteItem = document.createElement('button');
  deleteItem.className = 'context-menu-item context-menu-item--danger';
  deleteItem.type = 'button';
  deleteItem.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i> Delete Event';
  deleteItem.addEventListener('click', () => {
    hideContextMenu();
    onDelete();
  });

  menu.append(editItem, deleteItem);
  document.body.append(menu);
  activeContextMenu = menu;

  // Position the menu, clamped to viewport
  const rect = menu.getBoundingClientRect();
  const clampedX = Math.min(x, window.innerWidth - rect.width - 8);
  const clampedY = Math.min(y, window.innerHeight - rect.height - 8);
  menu.style.left = Math.max(8, clampedX) + 'px';
  menu.style.top = Math.max(8, clampedY) + 'px';

  // Close on outside click
  requestAnimationFrame(() => {
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        hideContextMenu();
        document.removeEventListener('click', closeHandler, true);
        document.removeEventListener('contextmenu', closeHandler, true);
      }
    };
    document.addEventListener('click', closeHandler, true);
    document.addEventListener('contextmenu', closeHandler, true);
  });
}

export function hideContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

/* ─── Shared Helpers ────────────────────────── */

function positionPopover(element, anchor) {
  const anchorRect = anchor.getBoundingClientRect();
  const elRect = element.getBoundingClientRect();

  // Try to position above the anchor, centered
  let top = anchorRect.top - elRect.height - 8;
  let left = anchorRect.left + anchorRect.width / 2 - elRect.width / 2;

  // If above goes off-screen, position below
  if (top < 8) {
    top = anchorRect.bottom + 8;
  }

  // Clamp horizontally
  left = Math.max(8, Math.min(left, window.innerWidth - elRect.width - 8));

  // Clamp vertically
  top = Math.max(8, Math.min(top, window.innerHeight - elRect.height - 8));

  element.style.left = left + 'px';
  element.style.top = top + 'px';
}

function renderEventList(container, events, emptyMessage) {
  if (events.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-copy';
    emptyState.textContent = emptyMessage;
    container.replaceChildren(emptyState);
    return;
  }

  container.replaceChildren(...events.slice(0, 3).map(createSidebarEvent));
}

function updateAllEventsYearOptions(selectEl, events, selectedYear) {
  const yearsSet = new Set();
  const currentYr = String(new Date().getFullYear());
  yearsSet.add(currentYr);

  events.forEach((evt) => {
    const yr = evt.date.split('-')[0];
    if (yr) yearsSet.add(yr);
  });

  const sortedYears = [...yearsSet].sort((a, b) => Number(a) - Number(b));

  selectEl.replaceChildren();

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All Years';
  selectEl.append(allOpt);

  sortedYears.forEach((yr) => {
    const opt = document.createElement('option');
    opt.value = yr;
    opt.textContent = yr;
    if (yr === selectedYear) opt.selected = true;
    selectEl.append(opt);
  });

  selectEl.value = selectedYear;
}

function renderAllEventsList(container, events, filterState) {
  const { query, year, month } = filterState;

  const filtered = events.filter((evt) => {
    const parts = evt.date.split('-');
    const evtYear = parts[0];
    const evtMonth = String(Number(parts[1]) - 1);

    const matchesYear = year === 'all' || evtYear === year;
    const matchesMonth = month === 'all' || evtMonth === month;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q
      || evt.title.toLowerCase().includes(q)
      || (evt.description || '').toLowerCase().includes(q)
      || evt.category.toLowerCase().includes(q);

    return matchesYear && matchesMonth && matchesQuery;
  });

  if (filtered.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-copy';
    emptyState.textContent = events.length === 0 ? 'No saved events yet.' : 'No matching events found.';
    container.replaceChildren(emptyState);
    return;
  }

  const sortedEvents = [...filtered].sort((a, b) =>
    (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))
  );

  container.replaceChildren(...sortedEvents.map(createSidebarEvent));
}

function renderCategoryFilters(container, toggleBtn, events, selectedCategories) {
  if (toggleBtn) {
    toggleBtn.textContent = selectedCategories.size === CATEGORIES.length ? 'Deselect All' : 'Select All';
  }

  const filterButtons = CATEGORIES.map((category) => {
    const button = document.createElement('button');
    const isSelected = selectedCategories.has(category);
    const count = events.filter((event) => event.category === category).length;
    const dot = document.createElement('span');
    const countLabel = document.createElement('span');

    button.className = 'filter' + (isSelected ? ' active' : '');
    button.type = 'button';
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(isSelected));
    button.style.setProperty('--category-color', CATEGORY_COLORS[category]);
    dot.className = 'filter-dot';
    countLabel.className = 'filter-count';
    countLabel.textContent = String(count);
    button.append(dot, document.createTextNode(category), countLabel);
    return button;
  });

  container.replaceChildren(...filterButtons);
}

function createSidebarEvent(event) {
  const item = document.createElement('button');
  const eventTime = document.createElement('span');
  const details = document.createElement('span');
  const title = document.createElement('strong');
  const metadata = document.createElement('small');

  item.className = 'sidebar-event';
  item.type = 'button';
  item.dataset.sidebarEventId = event.id;
  item.style.setProperty('--event-color', event.color);
  eventTime.className = 'sidebar-event-date';
  eventTime.textContent = dayFormatter.format(parseLocalDate(event.date)) + ' ' + monthFormatter.format(parseLocalDate(event.date));
  title.textContent = event.title;
  metadata.textContent = (event.time || 'All day') + ' \u00B7 ' + event.category;
  details.append(title, metadata);
  item.append(eventTime, details);
  return item;
}

function getUpcomingEvents(events) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return events
        .filter(event => {
            const d = parseLocalDate(event.date);
            return d >= today && d <= nextWeek;
        })
        .sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time)
        );
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function parseLocalDate(dateValue) {
  const parts = dateValue.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}
