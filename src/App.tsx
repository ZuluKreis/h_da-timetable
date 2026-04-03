import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { Calendar, MapPin, Plus, Tag, Trash2, X } from 'lucide-react';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'] as const;
const TIMES = [
  '8:30 - 10:00',
  '10:15 - 11:45',
  '12:00 - 13:30',
  '14:15 - 15:45',
  '16:00 - 17:30',
  '17:45 - 19:15',
] as const;

const EVENT_TYPES = ['Vorlesung', 'Praktikum', 'Übung', 'Seminar', 'Tutorium'] as const;
const WEEKS = ['A', 'B', 'Beide'] as const;
const PRIORITIES = [1, 2, 3] as const;
const WEEK_FILTERS = ['Alle', 'A', 'B'] as const;
const PRIORITY_FILTERS = ['Alle', 'Nur P1'] as const;

type EventType = (typeof EVENT_TYPES)[number];
type Week = (typeof WEEKS)[number];
type Priority = (typeof PRIORITIES)[number];
type WeekFilter = (typeof WEEK_FILTERS)[number];
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

interface ScheduleEvent {
  id: string;
  title: string;
  type: EventType;
  day: number;
  time: number;
  week: Week;
  priority: Priority;
  room: string;
}

type EventFormData = Omit<ScheduleEvent, 'id'>;

interface EventsResponse {
  events: ScheduleEvent[];
}

const DEFAULT_EVENTS: ScheduleEvent[] = [
  { id: '1', title: 'Informatik I', type: 'Vorlesung', day: 0, time: 0, week: 'Beide', priority: 1, room: 'HS 1' },
  { id: '2', title: 'Physik Praktikum', type: 'Praktikum', day: 1, time: 2, week: 'A', priority: 1, room: 'Labor 4' },
  { id: '3', title: 'Physik Praktikum', type: 'Praktikum', day: 1, time: 2, week: 'B', priority: 2, room: 'Labor 4' },
  { id: '4', title: 'Mathe Übung', type: 'Übung', day: 3, time: 3, week: 'B', priority: 3, room: 'Raum 102' },
];

const EMPTY_FORM: EventFormData = {
  title: '',
  type: 'Vorlesung',
  day: 0,
  time: 0,
  week: 'Beide',
  priority: 1,
  room: '',
};

export default function App() {
  const [events, setEvents] = useState<ScheduleEvent[]>(DEFAULT_EVENTS);
  const [activeWeekFilter, setActiveWeekFilter] = useState<WeekFilter>('Alle');
  const [activePriorityFilter, setActivePriorityFilter] = useState<PriorityFilter>('Alle');
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);

  useEffect(() => {
    let ignore = false;

    async function loadEvents() {
      try {
        const response = await fetch('/api/events');

        if (!response.ok) {
          throw new Error('load failed');
        }

        const data: EventsResponse = await response.json();

        if (!ignore && Array.isArray(data.events)) {
          setEvents(data.events);
          setSaveError('');
        }
      } catch {
        if (!ignore) {
          setSaveError('JSON-Speicher nicht erreichbar. Die Daten werden nicht in eine Datei geschrieben.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadEvents();

    return () => {
      ignore = true;
    };
  }, []);

  const persistEvents = async (nextEvents: ScheduleEvent[]) => {
    const response = await fetch('/api/events', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: nextEvents }),
    });

    if (!response.ok) {
      throw new Error('save failed');
    }

    setSaveError('');
  };

  const openModal = (day = 0, time = 0, event: ScheduleEvent | null = null) => {
    if (event) {
      const { id, ...nextFormData } = event;
      void id;
      setFormData(nextFormData);
      setEditingEvent(event.id);
    } else {
      setFormData({
        ...EMPTY_FORM,
        day,
        time,
      });
      setEditingEvent(null);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEvents = editingEvent
      ? events.map((entry) => (entry.id === editingEvent ? { ...formData, id: editingEvent } : entry))
      : [...events, { ...formData, id: Date.now().toString() }];

    setEvents(nextEvents);
    closeModal();

    void persistEvents(nextEvents).catch(() => {
      setSaveError('Speichern in data/events.json ist fehlgeschlagen.');
    });
  };

  const requestDelete = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (!itemToDelete) {
      return;
    }

    const nextEvents = events.filter((entry) => entry.id !== itemToDelete);

    setEvents(nextEvents);
    setItemToDelete(null);

    void persistEvents(nextEvents).catch(() => {
      setSaveError('Speichern in data/events.json ist fehlgeschlagen.');
    });
  };

  const getWeekColors = (week: Week) => {
    switch (week) {
      case 'A':
        return 'bg-sky-100 border-sky-400 text-sky-900';
      case 'B':
        return 'bg-emerald-100 border-emerald-400 text-emerald-900';
      case 'Beide':
        return 'bg-purple-100 border-purple-400 text-purple-900';
    }
  };

  const getPrioColors = (priority: Priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-500 text-white';
      case 2:
        return 'bg-orange-500 text-white';
      case 3:
        return 'bg-yellow-500 text-white';
    }
  };

  const matchesWeekFilter = (eventWeek: Week) => {
    if (activeWeekFilter === 'Alle') {
      return true;
    }

    return eventWeek === 'Beide' || eventWeek === activeWeekFilter;
  };

  const matchesPriorityFilter = (priority: Priority) => {
    if (activePriorityFilter === 'Alle') {
      return true;
    }

    return priority === 1;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <Calendar className="h-8 w-8 text-indigo-600" />
              Uni Stundenplan
            </h1>
            <p className="mt-1 text-gray-500">Plane deine Vorlesungen und Praktika effizient.</p>
            <p className="mt-2 text-sm text-gray-500">
              {isLoading ? 'Lade Stundenplan aus data/events.json ...' : 'Speicherort: data/events.json'}
            </p>
            {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Wochenansicht</p>
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  {WEEK_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveWeekFilter(filter)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        activeWeekFilter === filter
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter === 'Alle' ? 'Alle Wochen' : `Woche ${filter}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Prioritäten</p>
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  {PRIORITY_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActivePriorityFilter(filter)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        activePriorityFilter === filter
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-sky-400"></span> Woche A
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-400"></span> Woche B
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-400"></span> Beide Wochen
              </div>
              <div className="hidden h-4 w-px bg-gray-300 md:block"></div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">P1</span> Prio 1
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">P2</span> Prio 2
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-white">P3</span> Prio 3
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[100px_repeat(5,minmax(0,1fr))] border-b border-gray-200 bg-gray-100">
              <div className="p-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-600">Zeit</div>
              {DAYS.map((day) => (
                <div key={day} className="min-w-0 border-l border-gray-200 p-3 text-center font-semibold text-gray-800">
                  {day}
                </div>
              ))}
            </div>

            {TIMES.map((timeLabel, timeIndex) => (
              <div key={timeLabel} className="grid grid-cols-[100px_repeat(5,minmax(0,1fr))] border-b border-gray-100 last:border-0">
                <div className="min-w-0 bg-gray-50/50 p-3 text-center text-sm font-medium text-gray-500">
                  <div className="flex h-full items-center justify-center">{timeLabel}</div>
                </div>

                {DAYS.map((_, dayIndex) => {
                  const cellEvents = events.filter(
                    (entry) =>
                      entry.day === dayIndex &&
                      entry.time === timeIndex &&
                      matchesWeekFilter(entry.week) &&
                      matchesPriorityFilter(entry.priority)
                  );

                  return (
                    <div
                      key={`${dayIndex}-${timeIndex}`}
                      className="group relative flex min-h-[120px] min-w-0 cursor-pointer flex-col border-l border-gray-200 p-1.5 transition-colors hover:bg-gray-50"
                      onClick={() => openModal(dayIndex, timeIndex)}
                    >
                      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Plus className="h-8 w-8 text-indigo-500 drop-shadow-md" />
                      </div>

                      <div className="relative z-20 flex h-full flex-1 flex-row gap-1.5">
                        {cellEvents.map((entry) => (
                          <div
                            key={entry.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              openModal(dayIndex, timeIndex, entry);
                            }}
                            className={`group/event relative flex min-w-0 flex-1 flex-col rounded-md border-l-4 p-2 text-sm shadow-sm transition-shadow hover:shadow-md ${getWeekColors(entry.week)}`}
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <span className="truncate pr-6 font-bold leading-tight">{entry.title}</span>
                              <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm ${getPrioColors(entry.priority)}`}>
                                P{entry.priority}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-1 flex-col gap-0.5 text-xs opacity-90">
                              <span className="font-medium">{entry.type}</span>
                              {entry.room && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{entry.room}</span>
                                </span>
                              )}
                              <span className="mt-0.5 flex items-center gap-1 truncate font-medium">
                                <Tag className="h-3 w-3 flex-shrink-0" /> <span className="truncate">Woche: {entry.week}</span>
                              </span>
                            </div>

                            <button
                              onClick={(event) => requestDelete(entry.id, event)}
                              className="absolute bottom-2 right-2 rounded-md bg-white/80 p-1.5 text-red-600 opacity-0 transition-opacity hover:bg-red-100 group-hover/event:opacity-100"
                              title="Löschen"
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl duration-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">{editingEvent ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</h2>
              <button onClick={closeModal} className="text-gray-400 transition-colors hover:text-gray-600" type="button">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Titel (Fach)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="z.B. Hohere Mathematik"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Typ</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.type}
                    onChange={(event) => setFormData({ ...formData, type: event.target.value as EventType })}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Raum (optional)</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.room}
                    onChange={(event) => setFormData({ ...formData, room: event.target.value })}
                    placeholder="z.B. Audimax"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tag</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.day}
                    onChange={(event) => setFormData({ ...formData, day: Number.parseInt(event.target.value, 10) })}
                  >
                    {DAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Uhrzeit</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.time}
                    onChange={(event) => setFormData({ ...formData, time: Number.parseInt(event.target.value, 10) })}
                  >
                    {TIMES.map((time, index) => (
                      <option key={time} value={index}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Rhythmus</label>
                  <div className="flex flex-col gap-2">
                    {WEEKS.map((week) => (
                      <label key={week} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="week"
                          value={week}
                          checked={formData.week === week}
                          onChange={(event) => setFormData({ ...formData, week: event.target.value as Week })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm">{week === 'Beide' ? 'Jede Woche' : `Woche ${week}`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Priorität</label>
                  <div className="flex flex-col gap-2">
                    {PRIORITIES.map((priority) => (
                      <label key={priority} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={(event) => setFormData({ ...formData, priority: Number.parseInt(event.target.value, 10) as Priority })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="flex items-center gap-2 text-sm">
                          Prio {priority}
                          <span className={`h-2.5 w-2.5 rounded-full ${priority === 1 ? 'bg-red-500' : priority === 2 ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  {editingEvent ? 'Anderungen speichern' : 'Eintrag hinzufugen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 text-center shadow-xl duration-200 animate-in fade-in zoom-in-95">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Eintrag loschen?</h3>
            <p className="mb-6 text-gray-500">Mochtest du diesen Eintrag wirklich aus deinem Stundenplan entfernen?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                type="button"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
                type="button"
              >
                Loschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}