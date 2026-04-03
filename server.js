import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_EVENTS = [
  { id: '1', title: 'Informatik I', type: 'Vorlesung', day: 0, time: 0, week: 'Beide', priority: 1, room: 'HS 1' },
  { id: '2', title: 'Physik Praktikum', type: 'Praktikum', day: 1, time: 2, week: 'A', priority: 1, room: 'Labor 4' },
  { id: '3', title: 'Physik Praktikum', type: 'Praktikum', day: 1, time: 2, week: 'B', priority: 2, room: 'Labor 4' },
  { id: '4', title: 'Mathe Übung', type: 'Übung', day: 3, time: 3, week: 'B', priority: 3, room: 'Raum 102' },
];

const dataFileUrl = new URL('./data/events.json', import.meta.url);

async function ensureDataFile() {
  const dataPath = fileURLToPath(dataFileUrl);
  await mkdir(dirname(dataPath), { recursive: true });

  const file = Bun.file(dataFileUrl);
  if (!(await file.exists())) {
    await Bun.write(dataFileUrl, JSON.stringify({ events: DEFAULT_EVENTS }, null, 2));
    return DEFAULT_EVENTS;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.events) ? parsed.events : DEFAULT_EVENTS;
  } catch {
    await Bun.write(dataFileUrl, JSON.stringify({ events: DEFAULT_EVENTS }, null, 2));
    return DEFAULT_EVENTS;
  }
}

async function writeEvents(events) {
  await Bun.write(dataFileUrl, JSON.stringify({ events }, null, 2));
}

Bun.serve({
  port: 3001,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/events' && request.method === 'GET') {
      const events = await ensureDataFile();
      return Response.json({ events });
    }

    if (url.pathname === '/api/events' && request.method === 'PUT') {
      try {
        const body = await request.json();

        if (!Array.isArray(body.events)) {
          return Response.json({ error: 'Invalid events payload' }, { status: 400 });
        }

        await writeEvents(body.events);
        return Response.json({ events: body.events });
      } catch {
        return Response.json({ error: 'Could not save events' }, { status: 400 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log('Bun API listening on http://localhost:3001');