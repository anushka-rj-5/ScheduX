import { CATEGORIES, CATEGORY_COLORS } from './constants.js';

const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

/** Renders dynamic sidebar content and exposes category filter state. */
export function initializeSidebar({ onCategoryChange = () => {}, onEventClick = () => {} } = {}) {
  const todayDate = document.querySelector('[data-today-date]');
  const todayEvents = document.querySelector('[data-today-events]');
  const upcomingEvents = document.querySelector('[data-upcoming-events]');
  const categoryFilters = document.querySelector('[data-category-filters]');
  const announcements = document.querySelector('[data-announcements]');
  const selectedCategories = new Set();

  if (!todayDate || !todayEvents || !upcomingEvents || !categoryFilters || !announcements) {
    return null;
  }

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

  [todayEvents, upcomingEvents].forEach((container) => {
    container.addEventListener('click', (event) => {
      const eventButton = event.target.closest('[data-sidebar-event-id]');

      if (eventButton) {
        onEventClick(eventButton.dataset.sidebarEventId);
      }
    });
  });

  return {
    getSelectedCategories: () => [...selectedCategories],
    render({ allEvents, visibleEvents }) {
      const today = new Date();
      const todayKey = formatDateKey(today);
      todayDate.textContent = dayFormatter.format(today);
      renderEventList(todayEvents, visibleEvents.filter((event) => event.date === todayKey), 'No events scheduled today.');
      renderEventList(upcomingEvents, getUpcomingEvents(visibleEvents, todayKey), 'No upcoming events yet.');
      renderCategoryFilters(categoryFilters, allEvents, selectedCategories);
    },
    renderAnnouncements(posts) {
      announcements.replaceChildren(...posts.map(createAnnouncement));
    },
    setAnnouncementsLoading(isLoading) {
      if (isLoading) {
        const skeleton = document.createElement('div');
        skeleton.className = 'announcement-skeleton';
        skeleton.setAttribute('aria-label', 'Loading announcements');
        announcements.replaceChildren(skeleton);
      }
    },
    setAnnouncementsError(message) {
      const error = document.createElement('p');
      error.className = 'empty-copy';
      error.textContent = message;
      announcements.replaceChildren(error);
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

function renderCategoryFilters(container, events, selectedCategories) {
  const filterButtons = CATEGORIES.map((category) => {
    const button = document.createElement('button');
    const isSelected = selectedCategories.has(category);
    const count = events.filter((event) => event.category === category).length;
    const dot = document.createElement('span');
    const countLabel = document.createElement('span');

    button.className = `filter${isSelected ? ' active' : ''}`;
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
  eventTime.textContent = `${dayFormatter.format(parseLocalDate(event.date))} ${monthFormatter.format(parseLocalDate(event.date))}`;
  title.textContent = event.title;
  metadata.textContent = `${event.time || 'All day'} · ${event.category}`;
  details.append(title, metadata);
  item.append(eventTime, details);
  return item;
}

function createAnnouncement(post) {
  const article = document.createElement('article');
  const title = document.createElement('strong');
  const body = document.createElement('p');

  article.className = 'announcement-item';
  title.textContent = post.title;
  body.textContent = post.body;
  article.append(title, body);
  return article;
}

function getUpcomingEvents(events, todayKey) {
  return events
    .filter((event) => event.date >= todayKey)
    .sort((firstEvent, secondEvent) => `${firstEvent.date}${firstEvent.time}`.localeCompare(`${secondEvent.date}${secondEvent.time}`));
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}
