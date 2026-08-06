import {DownloadedMap, PickedLocation} from '../../types/maps';
import {MAX_DOWNLOADED_MAPS} from '../../redux/maps/initialState';

export const LIMIT_MESSAGE = `You can keep up to ${MAX_DOWNLOADED_MAPS} downloaded maps. Delete one to make room.`;

export const duplicateMessage = (name: string): string =>
  `${name} is already downloaded.`;

export const canSave = (items: DownloadedMap[]): boolean =>
  items.length < MAX_DOWNLOADED_MAPS;

/** ≈55 m. Two pins this close are the same place under a different label. */
const SAME_PLACE_DEGREES = 0.0005;

/**
 * The shipped app rejected on name alone, which let the same corner be saved
 * twice under two geocoded labels. Coordinate proximity closes that.
 */
export function isDuplicate(
  items: DownloadedMap[],
  picked: PickedLocation,
): boolean {
  const name = picked.name.trim().toLowerCase();
  return items.some(item => {
    if (item.name.trim().toLowerCase() === name) {
      return true;
    }
    return (
      Math.abs(item.coordinate.latitude - picked.coordinate.latitude) <
        SAME_PLACE_DEGREES &&
      Math.abs(item.coordinate.longitude - picked.coordinate.longitude) <
        SAME_PLACE_DEGREES
    );
  });
}

/** Opaque, and never rendered — same shape as the outbox's local ids. */
export const newMapId = (): string =>
  `map_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const toDownloadedMap = (picked: PickedLocation): DownloadedMap => ({
  id: newMapId(),
  name: picked.name,
  address: picked.address,
  downloadedAt: new Date().toISOString(),
  coordinate: picked.coordinate,
});

/** The mockup's "Downloaded Jul 12, 2026" form. */
export function formatDownloadedOn(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
