# ScheduX

**Plan Better. Stay Organized.**

ScheduX is a responsive, frontend-only event calendar built with HTML, CSS, and vanilla JavaScript modules. It starts with no seeded events: users create their own schedule, while public holidays come from Calendarific.

## Features

- Interactive monthly calendar with previous, next, Today, selected-date, and current-date states
- Create, edit, and delete local events with validation and overlap detection
- Live title/description search and instant multi-category filters
- Local Storage persistence for events, holiday cache, and theme preference
- Calendarific holiday/festival rendering with loading and failure states
- JSONPlaceholder planning announcements in the sidebar
- Responsive dark theme, toast feedback, keyboard support, reduced-motion support, and accessible dialogs

## Calendarific setup

1. Create a Calendarific API key.
2. In `index.html`, set the `content` value for the `calendarific-api-key` meta tag.
3. Reload the app. The default holiday country is India (`IN`), configured in `js/constants.js`.

Without a key, ScheduX keeps working and shows a friendly message instead of displaying sample holidays.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.
