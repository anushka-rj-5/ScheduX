import { DEFAULT_EVENT_COLOR, CATEGORY_COLORS } from './constants.js';

/** Controls the accessible form dialog used to create and edit events. */
export function initializeEventModal({ getSelectedDate, onDelete, onSave }) {
  const backdrop = document.querySelector('[data-event-modal-backdrop]');
  const dialog = document.querySelector('#event-modal');
  const form = document.querySelector('#event-form');
  const titleInput = document.querySelector('#event-title');
  const dateInput = document.querySelector('#event-date');
  const colorInput = document.querySelector('#event-color');
  const categoryInput = document.querySelector('#event-category');
  const errorMessage = document.querySelector('#event-form-error');
  const dialogTitle = document.querySelector('#event-modal-title');
  const deleteButton = document.querySelector('[data-delete-event]');

  if (!backdrop || !dialog || !form || !titleInput || !dateInput || !colorInput || !categoryInput || !errorMessage || !dialogTitle || !deleteButton) {
    return null;
  }

  let activeEvent = null;
  let lastTrigger = null;

  const closeModal = () => {
    dialog.hidden = true;
    backdrop.classList.remove('is-visible');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    clearError();
    lastTrigger?.focus();
  };

  const openModal = () => {
    lastTrigger = document.activeElement;
    dialog.hidden = false;
    backdrop.classList.add('is-visible');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => titleInput.focus());
  };

  const openCreate = () => {
    activeEvent = null;
    form.reset();
    dateInput.value = getSelectedDate();
    categoryInput.value = 'Study';
    colorInput.value = DEFAULT_EVENT_COLOR;
    dialogTitle.textContent = 'Add event';
    deleteButton.hidden = true;
    openModal();
  };

  const openEdit = (event) => {
    activeEvent = event;
    form.elements.title.value = event.title;
    form.elements.description.value = event.description;
    form.elements.date.value = event.date;
    form.elements.time.value = event.time;
    form.elements.category.value = event.category;
    colorInput.value = event.color;
    dialogTitle.textContent = 'Edit event';
    deleteButton.hidden = false;
    openModal();
  };

  categoryInput.addEventListener('change', () => {
  colorInput.value = CATEGORY_COLORS[categoryInput.value] || DEFAULT_EVENT_COLOR;
});

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = onSave(getDraft(form), activeEvent?.id);

    if (result.error) {
      showError(result.error);
      return;
    }

    closeModal();
  });

  deleteButton.addEventListener('click', () => {
    if (!activeEvent || !window.confirm(`Delete “${activeEvent.title}”?`)) {
      return;
    }

    onDelete(activeEvent.id);
    closeModal();
  });

  dialog.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) {
      closeModal();
    }
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = [...dialog.querySelectorAll('button, input, select, textarea')]
      .filter((element) => !element.hidden && !element.disabled);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  return { openCreate, openEdit };

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
  }
}

function getDraft(form) {
  return {
    title: form.elements.title.value,
    description: form.elements.description.value,
    date: form.elements.date.value,
    time: form.elements.time.value,
    category: form.elements.category.value,
    color: form.elements.color.value,
  };
}
