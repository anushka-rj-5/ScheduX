import { storageService } from './storage.js';

/** Applies and persists the user's preferred color theme. */
export function initializeTheme() {
  const themeButton = document.querySelector('[data-theme-toggle]');
  const storedTheme = storageService.loadPreference('theme', 'light');

  applyTheme(storedTheme === 'dark' ? 'dark' : 'light');

  themeButton?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    storageService.savePreference('theme', nextTheme);
  });
}

function applyTheme(themeName) {
  const themeButton = document.querySelector('[data-theme-toggle]');
  const isDarkTheme = themeName === 'dark';

  document.documentElement.dataset.theme = themeName;
  themeButton?.setAttribute('aria-label', `Switch to ${isDarkTheme ? 'light' : 'dark'} theme`);
  const icon = themeButton?.querySelector('i');

  if (icon) {
    icon.className = isDarkTheme ? 'fa-solid fa-sun' : 'fa-regular fa-moon';
  }
}
