# Stundenplan

A small timetable web app for managing lectures, labs, tutorials, and other university events.

The frontend is built with React and Vite. A small Bun API stores timetable changes in a local JSON file so entries persist across page reloads, app restarts, and browser changes on the same machine.

## Features

- Add, edit, and delete timetable entries
- Organize events by day, time, week rhythm, room, and priority
- Persist timetable data in `data/events.json`
- Keep sample data in `data/example_events.json`
- Share the same saved timetable across browsers on the same computer

## Tech Stack

- React
- TypeScript
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

Create a local runtime data file from the tracked example data:

```bash
cp data/example_events.json data/events.json
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

Run the frontend and API together.

```bash
bun run dev
```

Run only the Vite frontend.

```bash
bun run dev:web
```

Run only the Bun API.

```bash
bun run dev:api
```

Create a production build.

```bash
bun run build
```

Preview the production build locally.

```bash
bun run preview
```

## Data Storage

The app writes live timetable data to:

```text
data/events.json
```

The repository also includes a tracked sample file:

```text
data/example_events.json
```

This means:

- Data survives browser refreshes and app restarts.
- Clearing cookies or local storage does not remove saved entries.
- Different browsers on the same machine use the same saved timetable.
- `data/events.json` is local runtime data and should not be committed.
- `data/example_events.json` is the checked-in example dataset for the repository.

To initialize a fresh local setup, copy `data/example_events.json` to `data/events.json`.

If `data/events.json` is missing, the Bun API now returns an error instead of silently recreating the file.

## Project Structure

```text
.
|- data/events.json
|- data/example_events.json
|- server.ts
|- src/App.tsx
|- src/main.tsx
|- vite.config.ts
```
