import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {BottomSheet} from './ui';
import {ChevronRightIcon, MapPinIcon, TargetIcon} from './icons';
import {GetDownloadedMaps} from '../redux/maps/selectors';
import {getCurrentPosition, reverseGeocode} from '../services/maps';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  /** Receives the picked place's formatted address. */
  onSelect: (address: string) => void;
  onClose: () => void;
}

/**
 * Picks the maintenance address from the Maps module's own two sources: the
 * device's current position, or a location already saved for offline use.
 * Free-text search deliberately isn't offered here — that's the Maps tab's
 * download flow, which bills against the Places quota per keystroke.
 */
const ChangeLocationSheet: React.FC<Props> = ({visible, onSelect, onClose}) => {
  const saved = GetDownloadedMaps();
  const [resolving, setResolving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (visible) {
      setResolving(false);
      setUnavailable(false);
    }
  }, [visible]);

  const useCurrentLocation = async () => {
    setResolving(true);
    setUnavailable(false);
    const coordinate = await getCurrentPosition();
    if (!coordinate) {
      setResolving(false);
      setUnavailable(true);
      return;
    }
    const place = await reverseGeocode(coordinate);
    setResolving(false);
    if (!place) {
      setUnavailable(true);
      return;
    }
    onSelect(place.address);
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Change Location" onClose={onClose}>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        disabled={resolving}
        onPress={useCurrentLocation}>
        <View style={styles.tile}>
          {resolving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TargetIcon size={18} color={theme.colors.primary} />
          )}
        </View>
        <View style={styles.main}>
          <Text style={styles.name}>Use current location</Text>
          <Text style={styles.address} numberOfLines={2}>
            {resolving
              ? 'Finding your location…'
              : unavailable
                ? "Couldn't get a location. Check location access and tap to retry."
                : 'Fills the address from where you are now'}
          </Text>
        </View>
        <ChevronRightIcon size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Downloaded locations</Text>

      {saved.length === 0 ? (
        <Text style={styles.empty}>
          No downloaded locations yet. Save one from the Maps tab to pick it
          here.
        </Text>
      ) : (
        saved.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => {
              onSelect(item.address);
              onClose();
            }}>
            <View style={styles.tile}>
              <MapPinIcon size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.main}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.address} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ))
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  tile: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {flex: 1},
  name: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: '#181B1F',
  },
  address: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.md,
  },
});

export default ChangeLocationSheet;
