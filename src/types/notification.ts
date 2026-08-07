/**
 * Which module the activity came from. Drives the row's badge, label, icon and
 * accent colour — not where tapping it goes. A Cleaning notification wears a
 * Cleaning badge but opens a Work Log entry, which is why `related` carries its
 * own record type.
 */
export type NotificationModule =
  | 'Maintenance'
  | 'Incident'
  | 'Fixture'
  | 'Equipment'
  | 'Cleaning'
  | 'POI'
  | 'System';

/** Record types this app can actually open a detail screen for. */
export type NotificationRecordType =
  | 'Maintenance'
  | 'Incident'
  | 'Fixture'
  | 'Poi'
  | 'WorkLog';

/** Overrides the module's default icon for one-off events like a sync. */
export type NotificationIcon = 'Sync' | 'Comment' | 'Clock' | 'Bell';

export interface NotificationTarget {
  recordType: NotificationRecordType;
  /** Opaque id handed to the owning module's detail query. Never displayed. */
  recordId: string;
  /** Display reference, e.g. '#MT-40877'. */
  reference: string;
  title: string;
}

/**
 * `AppNotification` rather than `Notification`: the DOM lib already owns that
 * name globally, and a collision compiles into confusing errors at every use.
 */
export interface AppNotification {
  id: string;
  module: NotificationModule;
  title: string;
  /** Bold runs delimited by `**` — see NotificationCard's renderer. */
  message: string;
  icon: NotificationIcon | null;
  /** ISO-8601, timezone-naive, same shape as every other mock. */
  createdAt: string;
  unread: boolean;
  /**
   * Null when there is nothing to open: System notifications have no record,
   * and Equipment has no detail screen in this build.
   */
  related: NotificationTarget | null;
}
