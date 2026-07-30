import { CATEGORIES } from './constants.js';

export const searchService = {
  filterEvents(events, { categories, query = "" } = {}) {
    query = query.trim().toLowerCase();
    const activeCategories = categories !== undefined ? categories : CATEGORIES;

    return events.filter(event => {
      const matchesCategory = activeCategories.length > 0 && activeCategories.includes(event.category);

      const matchesSearch =
        query === "" ||
        event.title.toLowerCase().includes(query) ||
        (event.description || "").toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }
};