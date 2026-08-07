import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  TabNavigation,
  createTargetForTile,
  navigateToTarget,
} from '../navigation/screens';

/**
 * Shared handling for the Add Requests sheet, which every list screen shows.
 *
 * A tile is never acted on the moment it's tapped: the sheet is a modal, and
 * iOS both drops an alert presented while another modal is up and strands a
 * modal whose screen is swapped out from under it. So the tile is held until
 * the sheet reports its modal gone.
 *
 * @param origin Screen name of the caller, handed to the create route so
 *   closing it unsaved can return the user to the tab they started on.
 * @param onSameTab Overrides the jump when the tile targets the tab it was
 *   tapped on. Only POI uses this — see CREATE_TARGET_BY_TILE.
 */
export const useAddRequestTiles = (origin: string, onSameTab?: () => void) => {
  // Every caller is a list screen inside its module's stack, so the parent is
  // the tab navigator — the only one that can cross to another module.
  const navigation = useNavigation().getParent<TabNavigation>();
  const [queuedTile, setQueuedTile] = useState<string | null>(null);

  /** Pass to the sheet's onSelect. */
  const queueTile = useCallback((tileId: string) => {
    setQueuedTile(tileId);
  }, []);

  /** Pass to the sheet's onClosed. */
  const flushTile = useCallback(() => {
    if (!queuedTile) return;
    setQueuedTile(null);

    const target = createTargetForTile(queuedTile);
    if (!target) {
      Alert.alert('Coming soon', `"${queuedTile}" is not wired up yet.`);
      return;
    }

    if (target.tab === origin) {
      if (onSameTab) {
        onSameTab();
        return;
      }
      // Already here — there is nowhere to send them back to on an unsaved
      // close, so the create route gets no origin.
      navigateToTarget(navigation, target);
      return;
    }

    navigateToTarget(navigation, target, {origin});
  }, [navigation, onSameTab, origin, queuedTile]);

  return {queueTile, flushTile};
};
