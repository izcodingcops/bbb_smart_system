import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useAppDispatch} from '../redux/store';
import {requestCreate} from '../redux/ui/slice';
import {createTargetForTile} from '../navigation/screens';

/**
 * Shared handling for the Add Requests sheet, which every list screen shows.
 *
 * A tile is never acted on the moment it's tapped: the sheet is a modal, and
 * iOS both drops an alert presented while another modal is up and strands a
 * modal whose screen is swapped out from under it. So the tile is held until
 * the sheet reports its modal gone.
 *
 * @param origin Screen name of the caller, so a create flow opened from here
 *   knows where to send the user back to if they close it without saving.
 */
export const useAddRequestTiles = (origin: string) => {
  const dispatch = useAppDispatch();
  const [queuedTile, setQueuedTile] = useState<string | null>(null);

  /** Pass to the sheet's onSelect. */
  const queueTile = useCallback((tileId: string) => {
    setQueuedTile(tileId);
  }, []);

  /** Pass to the sheet's onClosed. */
  const flushTile = useCallback(() => {
    if (!queuedTile) return;
    const target = createTargetForTile(queuedTile);
    if (target) {
      dispatch(requestCreate({target, origin}));
    } else {
      Alert.alert('Coming soon', `"${queuedTile}" is not wired up yet.`);
    }
    setQueuedTile(null);
  }, [dispatch, origin, queuedTile]);

  return {queueTile, flushTile};
};
