import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {MapCoordinate, MapRegion, PickedLocation} from '../../../types/maps';
import {getCurrentPosition, reverseGeocode} from '../../../services/maps';
import {DENVER_DEFAULT_COORDINATE} from '../../../mocks/maps';
import MapSurface, {regionFor} from './MapSurface';
import {
  ChevronRightIcon,
  RefreshIcon,
  TargetIcon,
} from '../../../components/icons';
import {theme} from '../../../theme';

type Status = 'loading' | 'ready' | 'unavailable';

interface Props {
  onPress: () => void;
  /** Seeds the save flow's starting region. Must be useCallback-stable. */
  onCoordinateResolved?: (coordinate: MapCoordinate) => void;
}

/**
 * Live position over a small non-interactive map. A denied permission shows an
 * inline retry here rather than a modal wall — the shipped app's
 * goToHomeScreen() bailout is deliberately not carried over.
 */
const CurrentLocationCard: React.FC<Props> = ({
  onPress,
  onCoordinateResolved,
}) => {
  const [status, setStatus] = useState<Status>('loading');
  const [place, setPlace] = useState<PickedLocation | null>(null);

  // Read through a ref so a parent re-render can't strand the loader's
  // callback, and so `load` stays stable across renders.
  const resolvedRef = useRef(onCoordinateResolved);
  resolvedRef.current = onCoordinateResolved;

  // A permission prompt and a network geocode both sit inside `load`, so the
  // user can easily leave before it finishes. Same guard App.tsx's
  // OfflineQueueSync uses for its async effect.
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const load = useCallback(async () => {
    setStatus('loading');
    const coordinate = await getCurrentPosition();
    if (!mounted.current) {
      return;
    }
    if (!coordinate) {
      setStatus('unavailable');
      return;
    }
    resolvedRef.current?.(coordinate);
    const resolved = await reverseGeocode(coordinate);
    if (!mounted.current) {
      return;
    }
    setPlace(
      resolved ?? {
        name: 'Current location',
        address: 'Address unavailable',
        coordinate,
      },
    );
    setStatus('ready');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Held stable across renders: regionFor() builds a fresh object every call,
  // and MapSurface is memoized on its props. Above the early return below, so
  // the hook order never changes.
  const region: MapRegion = useMemo(
    () => regionFor(place?.coordinate ?? DENVER_DEFAULT_COORDINATE),
    [place],
  );

  if (status === 'unavailable') {
    return (
      <View style={styles.card}>
        <View style={styles.promptRow}>
          <View style={styles.iconTile}>
            <TargetIcon size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.promptText}>
            <Text style={styles.promptTitle}>Location unavailable</Text>
            <Text style={styles.promptBody}>
              Allow location access to see where you are on the map.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retry}
            activeOpacity={0.8}
            accessibilityLabel="Retry"
            onPress={load}>
            <RefreshIcon size={17} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={status === 'loading'}>
      <MapSurface
        region={region}
        interactive={false}
        showCenterPin
        style={styles.map}
      />

      <View style={styles.infoRow}>
        <View style={styles.iconTile}>
          <TargetIcon size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.kicker}>Current Location</Text>
          {status === 'loading' ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.address}>Finding your location…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.name} numberOfLines={1}>
                {place?.name}
              </Text>
              <Text style={styles.address} numberOfLines={2}>
                {place?.address}
              </Text>
            </>
          )}
        </View>
        <ChevronRightIcon size={20} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  map: {height: 132},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {flex: 1},
  kicker: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  name: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: '#181B1F',
  },
  address: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  promptText: {flex: 1},
  promptTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: '#181B1F',
  },
  promptBody: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  retry: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
});

export default React.memo(CurrentLocationCard);
