import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  TAB_ROOT_ROUTE,
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
 * @param origin Screen name of the caller, handed to the destination so
 *   backing out unsaved can return the user to the tab they started on.
 */
export const useAddRequestTiles = (origin: string) => {
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

    /*
     * `origin` only makes sense when a full-screen form covers the tab switch:
     * the user never sees the move, so closing it unsaved can quietly undo it.
     *
     * A target that lands on the module's own list — POI, whose three record
     * types mean the tile has to ask which one — puts the user visibly on that
     * tab instead. Sending them back from there would be the teleport, not the
     * fix, so those targets get no origin and everything after the switch is
     * that module's business.
     */
    const landsOnList = TAB_ROOT_ROUTE[target.tab] === target.screen;
    const carriesOrigin = target.tab !== origin && !landsOnList;
    navigateToTarget(navigation, target, carriesOrigin ? {origin} : undefined);
  }, [navigation, origin, queuedTile]);

  return {queueTile, flushTile};
};
