import React, {useEffect, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import MapView from 'react-native-maps';
import {MapCoordinate, MapRegion} from '../../../types/maps';
import {
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  TargetIcon,
} from '../../../components/icons';
import {theme} from '../../../theme';

/** Span of a freshly-centred map, in degrees — roughly a few city blocks. */
export const DEFAULT_DELTA = 0.012;

/** The shipped app's zoom step, clamped: MapView misbehaves on a zero span. */
const MIN_DELTA = 0.0005;
const MAX_DELTA = 80;

/**
 * Reciprocal on purpose: 0.5 × 2 is exactly 1, so zooming in and back out
 * returns to the span you started from. Any other pairing compounds — 0.55
 * and 1.8 multiply to 0.99, which creeps toward MIN_DELTA over a session.
 */
export const ZOOM_IN_FACTOR = 0.5;
export const ZOOM_OUT_FACTOR = 2;

export const regionFor = (
  coordinate: MapCoordinate,
  delta: number = DEFAULT_DELTA,
): MapRegion => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export function zoomedRegion(region: MapRegion, factor: number): MapRegion {
  const clamp = (value: number) =>
    Math.min(MAX_DELTA, Math.max(MIN_DELTA, value));
  return {
    ...region,
    latitudeDelta: clamp(region.latitudeDelta * factor),
    longitudeDelta: clamp(region.longitudeDelta * factor),
  };
}

const EPSILON = 1e-6;

const sameRegion = (a: MapRegion, b: MapRegion): boolean =>
  Math.abs(a.latitude - b.latitude) < EPSILON &&
  Math.abs(a.longitude - b.longitude) < EPSILON &&
  Math.abs(a.latitudeDelta - b.latitudeDelta) < EPSILON &&
  Math.abs(a.longitudeDelta - b.longitudeDelta) < EPSILON;

interface Props {
  region: MapRegion;
  /** Fired for user pans and for this surface's own zoom/recenter buttons. */
  onRegionChange?: (region: MapRegion) => void;
  /** Fixed pin drawn over the centre — the "move the map to adjust" model. */
  showCenterPin?: boolean;
  showControls?: boolean;
  /** Where the recenter button returns to. Hides the button when null. */
  recenterTo?: MapCoordinate | null;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Controlled MapView wrapper. The parent owns the region; programmatic moves
 * arrive as a new `region` prop and animate, while user pans travel outward
 * through `onRegionChange`.
 *
 * Both refs below exist to stop the map animating when nothing actually
 * changed. `lastReported` swallows the echo of a pan we just reported;
 * `applied` swallows a caller that rebuilds an equal region object every
 * render — regionFor() returns a fresh object each call, and without this the
 * effect would re-animate on every parent render.
 *
 * Never passes `provider` — the default means MapKit on iOS and Google Maps on
 * Android, which is what keeps the deployment target at 15.1.
 */
const MapSurface: React.FC<Props> = ({
  region,
  onRegionChange,
  showCenterPin = false,
  showControls = false,
  recenterTo = null,
  interactive = true,
  style,
}) => {
  const mapRef = useRef<MapView>(null);
  const initialRegion = useRef(region).current;
  const lastReported = useRef<MapRegion | null>(null);
  const applied = useRef<MapRegion>(initialRegion);

  useEffect(() => {
    const reported = lastReported.current;
    if (reported && sameRegion(reported, region)) {
      return;
    }
    if (sameRegion(applied.current, region)) {
      return;
    }
    applied.current = region;
    mapRef.current?.animateToRegion(region, 260);
  }, [region]);

  const handleRegionChangeComplete = (next: MapRegion) => {
    lastReported.current = next;
    onRegionChange?.(next);
  };

  const handleZoom = (factor: number) => {
    onRegionChange?.(zoomedRegion(region, factor));
  };

  const handleRecenter = () => {
    if (recenterTo) {
      onRegionChange?.(regionFor(recenterTo));
    }
  };

  return (
    <View style={[styles.root, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={
          interactive ? handleRegionChangeComplete : undefined
        }
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      />

      {showCenterPin ? (
        <View pointerEvents="none" style={styles.pin}>
          <MapPinIcon size={34} color={theme.colors.primary} />
        </View>
      ) : null}

      {showControls ? (
        <>
          <View style={styles.zoomCluster}>
            <TouchableOpacity
              style={styles.ctrl}
              activeOpacity={0.8}
              accessibilityLabel="Zoom in"
              onPress={() => handleZoom(ZOOM_IN_FACTOR)}>
              <PlusIcon size={17} color="#181B1F" />
            </TouchableOpacity>
            <View style={styles.ctrlDivider} />
            <TouchableOpacity
              style={styles.ctrl}
              activeOpacity={0.8}
              accessibilityLabel="Zoom out"
              onPress={() => handleZoom(ZOOM_OUT_FACTOR)}>
              <MinusIcon size={17} color="#181B1F" />
            </TouchableOpacity>
          </View>

          {recenterTo ? (
            <TouchableOpacity
              style={styles.recenter}
              activeOpacity={0.8}
              accessibilityLabel="Recenter"
              onPress={handleRecenter}>
              <TargetIcon size={19} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}
    </View>
  );
};

const CONTROL_SHADOW = {
  shadowColor: '#101828',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.14,
  shadowRadius: 6,
  elevation: 3,
};

const styles = StyleSheet.create({
  root: {overflow: 'hidden', backgroundColor: '#E5E7EB'},
  pin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    // Anchors the pin's tip, not its box, on the centre.
    transform: [{translateX: -17}, {translateY: -34}],
  },
  zoomCluster: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    ...CONTROL_SHADOW,
  },
  ctrl: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  ctrlDivider: {height: 1, backgroundColor: theme.colors.border},
  recenter: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    ...CONTROL_SHADOW,
  },
});

export default React.memo(MapSurface);
