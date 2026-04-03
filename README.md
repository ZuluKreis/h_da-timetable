# Stundenplan

A small timetable web app for managing lectures, labs, tutorials, and other university events.

The frontend is built with React and Vite. A small Bun API stores timetable changes in a JSON file so entries persist across page reloads, app restarts, and browser changes on the same machine.

## Features

- Add, edit, and delete timetable entries
- Organize events by day, time, week rhythm, room, and priority
- Persist timetable data in `data/events.json`
- Share the same saved timetable across browsers on the same computer

## Tech Stack

- React
- Vite
- Bun
- Tailwind CSS
- Lucide React

## Requirements

- Bun

## Getting Started

Install dependencies:

```bash
bun install
```

Start the development environment:

```bash
bun run dev
```

Then open:

```text
http://localhost:5173
```

This starts:

- The Vite frontend on `http://localhost:5173`
- The Bun API on `http://localhost:3001`

## Scripts

```bash
bun run dev
```

Run the frontend and API together.

```bash
bun run dev:web
```

Run only the Vite frontend.

```bash
bun run dev:api
```

Run only the Bun API.

```bash
bun run build
```

Create a production build.

```bash
bun run preview
```

Preview the production build locally.

## Data Storage

Saved timetable data is written to:

```text
data/events.json
```

This means:

- Data survives browser refreshes and app restarts.
- Clearing cookies or local storage does not remove saved entries.
- Different browsers on the same machine use the same saved timetable.

If `data/events.json` is removed, the app recreates it with the default sample entries.

## Project Structure

```text
.
|- data/events.json
|- server.js
|- src/App.jsx
|- src/main.jsx
|- vite.config.js
```
