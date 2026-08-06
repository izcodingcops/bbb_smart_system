import React, {useMemo, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {DownloadedMap, MapRegion} from '../../../types/maps';
import {formatDownloadedOn} from '../saving';
import MapSurface, {regionFor} from './MapSurface';
import {BottomSheet, DetailField} from '../../../components/ui';
import {CloudOffIcon, TrashIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  visible: boolean;
  item: DownloadedMap | null;
  onClose: () => void;
  /** Fired once the native modal is really gone — MapsScreen opens the delete
   *  confirm here, because iOS drops a modal presented while another is up. */
  onClosed?: () => void;
  onDelete: (item: DownloadedMap) => void;
}

/**
 * Read-only: the mockup's footer offers Cancel and Delete only, and neither
 * this module nor the shipped app has a rename.
 */
const MapDetailSheet: React.FC<Props> = ({
  visible,
  item,
  onClose,
  onClosed,
  onDelete,
}) => {
  // BottomSheet keeps animating for ~200ms after `visible` goes false, but the
  // list screen clears its selection in the same tick — so hold the last item
  // and let the content retreat with the sheet instead of blanking mid-slide.
  const lastShown = useRef<DownloadedMap | null>(null);
  if (item) {
    lastShown.current = item;
  }
  const shown = item ?? lastShown.current;

  // regionFor() builds a fresh object per call and MapSurface is memoized, so
  // the region is held stable against the item rather than the render.
  const region: MapRegion | null = useMemo(
    () => (shown ? regionFor(shown.coordinate) : null),
    [shown],
  );

  return (
    <BottomSheet
      visible={visible}
      title="Location details"
      onClose={onClose}
      onClosed={onClosed}>
      {shown && region ? (
        <View>
          <MapSurface
            region={region}
            interactive={false}
            showCenterPin
            style={styles.map}
          />

          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {shown.name}
            </Text>
            <View style={styles.badge}>
              <CloudOffIcon size={11} color="#C26401" />
              <Text style={styles.badgeText}>Offline</Text>
            </View>
          </View>

          <View style={styles.fields}>
            <DetailField label="Address" value={shown.address} full />
            <DetailField
              label="Downloaded on"
              value={formatDownloadedOn(shown.downloadedAt)}
              full
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancel}
              activeOpacity={0.85}
              onPress={onClose}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.delete}
              activeOpacity={0.85}
              onPress={() => onDelete(shown)}>
              <TrashIcon size={17} color={theme.colors.white} />
              <Text style={styles.deleteLabel}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  map: {
    height: 170,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  name: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 18,
    color: '#181B1F',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E6',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: theme.fonts.black,
    fontSize: 10.5,
    color: '#C26401',
  },
  fields: {gap: theme.spacing.lg},
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  cancel: {
    flex: 1,
    height: 52,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  cancelLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: '#181B1F',
  },
  delete: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 52,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CF1322',
  },
  deleteLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.white,
  },
});

export default MapDetailSheet;
