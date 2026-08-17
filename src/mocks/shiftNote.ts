import {ShiftNote} from '../types/shiftNote';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_NOW = Date.now();

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Seeded records are dated relative to *today*, never to the design's own fixed
 * July 2026 clock. Nothing lists these today, so a stale date would be
 * invisible rather than wrong — seed them correctly anyway, so the trap does
 * not spring the day a portal-style read surface arrives.
 */
function isoAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(SEED_NOW - daysAgo * DAY_MS);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${date}T${pad(hour)}:${pad(minute)}:00`;
}

/**
 * The design's own filled-in form, submitted.
 *
 * Numbered 0441 so the first form opened in a session reserves #SHN-0442 — the
 * reference the mockup itself shows. The four-digit padding is the design's
 * too, and `nextReference()` preserves it.
 */
const EXPLICIT: ShiftNote[] = [
  {
    id: 'shn_0441',
    reference: '#SHN-0441',
    shiftTypes: ['Cleaning', 'Safety', 'General'],
    sentAt: isoAt(1, 6, 5),
    zone: 'Downtown Louisville',
    sendToAll: true,
    ambassador: null,
    priority: 'Medium',
    title: 'Fourth Street rerouted until noon',
    description:
      'Stage crews close the 4th & Main crossing from 6–12. Push litter routes to Liberty and keep the hospitality post at the Muhammad Ali entrance — expect heavy foot traffic off the early trains.',
    createdBy: 'Jane Smith',
  },
];

const GENERATED: ShiftNote[] = [
  {
    id: 'shn_0440',
    reference: '#SHN-0440',
    shiftTypes: ['Safety'],
    sentAt: isoAt(4, 5, 40),
    zone: 'RiverFront',
    sendToAll: false,
    ambassador: 'Cam Hurd',
    priority: 'High',
    title: 'Cover the Witherspoon underpass first',
    description:
      'Two encampments reported overnight at the Witherspoon underpass. Walk it with a partner before opening the rest of the loop, and radio the shift lead before engaging.',
    createdBy: 'Jane Smith',
  },
  {
    id: 'shn_0439',
    reference: '#SHN-0439',
    shiftTypes: ['Cleaning', 'Hospitality'],
    sentAt: isoAt(9, 6, 15),
    zone: 'Waterfront Park',
    sendToAll: true,
    ambassador: null,
    priority: 'Low',
    title: 'Festival load-out — extra bagging on the lawn',
    description:
      'Load-out finishes this morning. Expect heavier bagging along the Great Lawn paths for the first two hours; nothing else changes about the route.',
    createdBy: 'Jane Smith',
  },
];

export const MOCK_SHIFT_NOTES: ShiftNote[] = [...EXPLICIT, ...GENERATED];
