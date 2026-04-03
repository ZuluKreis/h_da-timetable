/// <reference types="bun-types" />

import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVENT_TYPES = ['Vorlesung', 'Praktikum', 'Übung', 'Seminar', 'Tutorium'] as const;
const WEEKS = ['A', 'B', 'Beide'] as const;
const PRIORITIES = [1, 2, 3] as const;

type EventType = (typeof EVENT_TYPES)[number];
type Week = (typeof WEEKS)[number];
type Priority = (typeof PRIORITIES)[number];

interface ScheduleEvent {
  id: string;
  title: string;
  type: EventType;
  day: number;
  time: number;
  week: Week;
  priority: Priority;
  prof: string;
}

interface EventsPayload {
  events: ScheduleEvent[];
}

const dataFileUrl = new URL('./data/events.json', import.meta.url);

function isScheduleEvent(value: unknown): value is ScheduleEvent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.type === 'string' &&
    EVENT_TYPES.includes(candidate.type as EventType) &&
    typeof candidate.day === 'number' &&
    typeof candidate.time === 'number' &&
    typeof candidate.week === 'string' &&
    WEEKS.includes(candidate.week as Week) &&
    typeof candidate.priority === 'number' &&
    PRIORITIES.includes(candidate.priority as Priority) &&
    typeof candidate.prof === 'string'
  );
}

function isEventsPayload(value: unknown): value is EventsPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.events) && candidate.events.every(isScheduleEvent);
}

async function ensureDataFile(): Promise<ScheduleEvent[]> {
  const dataPath = fileURLToPath(dataFileUrl);
  await mkdir(dirname(dataPath), { recursive: true });

  const file = Bun.file(dataFileUrl);
  if (!(await file.exists())) {
    throw new Error('Missing data/events.json. Copy data/example_events.json to data/events.json first.');
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;

    if (isEventsPayload(parsed)) {
      return parsed.events;
    }

    throw new Error('Invalid data/events.json. Restore it from data/example_events.json or fix the JSON format.');
  } catch {
    throw new Error('Invalid data/events.json. Restore it from data/example_events.json or fix the JSON format.');
  }
}

async function writeEvents(events: ScheduleEvent[]) {
  const file = Bun.file(dataFileUrl);

  if (!(await file.exists())) {
    throw new Error('Missing data/events.json. Copy data/example_events.json to data/events.json first.');
  }

  await Bun.write(dataFileUrl, JSON.stringify({ events }, null, 2));
}

Bun.serve({
  port: 3001,
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/events' && request.method === 'GET') {
      try {
        const events = await ensureDataFile();
        return Response.json({ events });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Could not load events' },
          { status: 500 }
        );
      }
    }

    if (url.pathname === '/api/events' && request.method === 'PUT') {
      try {
        const body = (await request.json()) as unknown;

        if (!isEventsPayload(body)) {
          return Response.json({ error: 'Invalid events payload' }, { status: 400 });
        }

        await writeEvents(body.events);
        return Response.json({ events: body.events });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Could not save events' },
          { status: 400 }
        );
      }
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log('Bun API listening on http://localhost:3001');