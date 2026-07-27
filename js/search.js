/** Filters user events by live text and any selected category buttons. */
export const searchService = {
  filterEvents(events, { categories = [], query = '' } = {}) {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return events.filter((event) => {
      const matchesCategory = categories.length === 0 || categories.includes(event.category);
      const matchesQuery = !normalizedQuery
        || event.title.toLocaleLowerCase().includes(normalizedQuery)
        || event.description.toLocaleLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  },
};
