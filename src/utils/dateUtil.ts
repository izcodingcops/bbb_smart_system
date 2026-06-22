/**
 * Date utilities for the API layer.
 *
 * The backend expects local time with explicit offset in the form
 * `YYYY-MM-DDTHH:mm:ss.000±HH:MM` — same format as the old app's
 * `convertTimeZoneFormat`. Critically, the offset must match the
 * `timezone_str` field of the request (the PROGRAM's timezone), NOT the
 * device's local timezone. Otherwise the backend hangs trying to reconcile
 * a timestamp claimed to be in one zone but tagged with another's offset.
 */

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function findLocalOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function findOffsetForZone(date: Date, timeZone: string): string {
  try {
    // Get the wall-clock time of `date` AS RENDERED in `timeZone`, broken
    // down into numeric parts. Compare with the same date's UTC wall clock
    // to derive the offset in minutes. Avoids relying on `timeZoneName:
    // 'longOffset'` which Hermes' Intl doesn't implement correctly.
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hour12: false,
      minute: 'numeric',
      second: 'numeric',
    });
    const parts = dtf.formatToParts(date);
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? '0');

    const tzAsUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour') === 24 ? 0 : get('hour'),
      get('minute'),
      get('second'),
    );
    const realUtc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    );
    const diffMin = Math.round((tzAsUtc - realUtc) / 60000);
    const sign = diffMin >= 0 ? '+' : '-';
    const abs = Math.abs(diffMin);
    return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  } catch {
    return findLocalOffset(date);
  }
}

/**
 * Format a Date for the backend. If `timeZone` (IANA name like
 * "America/Kentucky/Louisville") is given, the OFFSET attached to the
 * timestamp will be that zone's offset, not the device's local offset.
 * The wall-clock parts (year/month/day/hour/min/sec) are taken as-is —
 * same behavior as old app's `convertTimeZoneFormat`.
 */
export function toServerDate(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    // Render the wall-clock parts AS SEEN IN the program timezone, then stamp
    // the program's offset — matching the old app's convertTimeZoneFormat.
    // Using device-local getHours()/getDate() here glues device wall-clock
    // numbers onto the program offset, producing an instant hours off from
    // reality (and a shift the backend treats as inactive).
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      });
      const parts = dtf.formatToParts(date);
      const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
      const hour = get('hour') === '24' ? '00' : get('hour');
      const offset = findOffsetForZone(date, timeZone);
      return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}.000${offset}`;
    } catch {
      // fall through to device-local formatting below
    }
  }
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const offset = findLocalOffset(date);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}.000${offset}`;
}
