export const searchService = {
    filterEvents(events, { categories = [], query = "" } = {}) {

        query = query.trim().toLowerCase();

        return events.filter(event => {

            const matchesCategory =
                categories.length === 0 ||
                categories.includes(event.category);

            const matchesSearch =
                query === "" ||
                event.title.toLowerCase().includes(query) ||
                (event.description || "").toLowerCase().includes(query) ||
                event.category.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }
};