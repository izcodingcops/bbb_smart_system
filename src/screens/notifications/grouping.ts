import {AppNotification} from '../../types/notification';

/**
 * The export hardcodes each record's group. Deriving it against the clock
 * instead is what stops the feed reading "Today" a month from now — the stale
 * mock dates trap, which has shipped here twice.
 */
export type RecencyBucket = 'today' | 'yesterday' | 'week' | 'earlier';

const BUCKET_ORDER: RecencyBucket[] = ['today', 'yesterday', 'week', 'earlier'];

export const BUCKET_LABEL: Record<RecencyBucket, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Last 7 days',
  // Not in the export, which has nothing this old. Without it a notification
  // that ages past a week would drop out of the list entirely.
  earlier: 'Earlier',
};

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Whole calendar days between `iso` and today. `round` rather than `floor`
 * because a DST boundary makes one day 23 or 25 hours long, which would
 * otherwise push a record a whole bucket out of place twice a year.
 */
function daysBetween(iso: string, now: number): number {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso).getTime())) / DAY);
}

export function bucketOf(iso: string, now: number = Date.now()): RecencyBucket {
  const days = daysBetween(iso, now);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 7) return 'week';
  return 'earlier';
}

export interface NotificationSection {
  bucket: RecencyBucket;
  title: string;
  data: AppNotification[];
}

/** Buckets in fixed order, empty ones dropped so no header renders alone. */
export function groupNotifications(
  notifications: AppNotification[],
  now: number = Date.now(),
): NotificationSection[] {
  const byBucket = new Map<RecencyBucket, AppNotification[]>();
  notifications.forEach(notification => {
    const bucket = bucketOf(notification.createdAt, now);
    const existing = byBucket.get(bucket);
    if (existing) {
      existing.push(notification);
    } else {
      byBucket.set(bucket, [notification]);
    }
  });

  return BUCKET_ORDER.filter(bucket => byBucket.get(bucket)?.length).map(
    bucket => ({
      bucket,
      title: BUCKET_LABEL[bucket],
      data: byBucket.get(bucket) ?? [],
    }),
  );
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Computed from the timestamp, so the row's label can never disagree with the
 * group it is sitting under.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} min ago`;
  }

  const days = daysBetween(iso, now);
  if (days === 0) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
