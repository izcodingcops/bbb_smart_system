const pad = (n: number): string => n.toString().padStart(2, '0');

/** Duration as HH:MM:SS (e.g. "02:34:17"). */
export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/** Duration as "3h 42m". */
export const formatHm = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
};

/** Clock time only (e.g. "7:02 AM"). */
export const formatTimeOfDay = (d: Date): string =>
  d.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});

/** Day + time relative to now (e.g. "Today · 9:41 AM"). */
export const formatWhen = (d: Date): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  let day: string;
  if (d.toDateString() === now.toDateString()) {
    day = 'Today';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    day = 'Tomorrow';
  } else {
    day = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
  }
  return `${day} · ${formatTimeOfDay(d)}`;
};
