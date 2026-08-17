import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import BottomSheet from './ui/BottomSheet';
import {
  AlertTriangleIcon,
  BoxIcon,
  ClockIcon,
  CubeIcon,
  FileTextIcon,
  LogInIcon,
  LogOutIcon,
  MapPinIcon,
  SearchIcon,
  SprayCanIcon,
  ToolsIcon,
  UserPlusIcon,
} from './icons';
import {theme} from '../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

export interface AddRequestTile {
  id: string;
  label: string;
  Icon: IconComponent;
}

const TILE_ICON = '#181B1F';

/**
 * Static half of the sheet. The "Work Log" section is left out because its one
 * tile is the shift the user is actually on, which only the caller knows.
 */
const SECTIONS: {key: string; title: string; tiles: AddRequestTile[]}[] = [
  {
    key: 'create',
    title: 'Create New',
    tiles: [
      {id: 'maintenance', label: 'Maintenance', Icon: ToolsIcon},
      {id: 'fixture', label: 'Fixture', Icon: BoxIcon},
      {id: 'incident', label: 'Incident', Icon: AlertTriangleIcon},
      {id: 'poi', label: 'POI', Icon: UserPlusIcon},
      {id: 'shift_notes', label: 'Shift Notes', Icon: FileTextIcon},
      // CubeIcon rather than BoxIcon: the sheet already spends BoxIcon on
      // Fixture, and two identical glyphs in one grid read as a mistake. The
      // source mockup pairs them the other way round (i-cube Fixture, i-box
      // Equipment) — not worth churning Fixture's established icon over.
      {id: 'equipment', label: 'Equipment', Icon: CubeIcon},
    ],
  },
  {
    key: 'equipment',
    title: 'Equipment',
    tiles: [
      {id: 'check_in', label: 'Check In', Icon: LogInIcon},
      {id: 'check_out', label: 'Check Out', Icon: LogOutIcon},
    ],
  },
  {
    key: 'reports',
    title: 'Add New Reports',
    // Only Off Hours Visit routes anywhere. Observation Reports is a
    // deliberately read-only archive and RVP Site Visit isn't ported yet, so
    // both fall through to useAddRequestTiles' "Coming soon" alert — the same
    // way check_in / check_out already do. They ship because the section reads
    // as incomplete with one tile in it.
    tiles: [
      {id: 'observation', label: 'Observation', Icon: SearchIcon},
      {id: 'off_hours', label: 'Off Hours Visit', Icon: ClockIcon},
      {id: 'rvp_site_visit', label: 'RVP Site Visit', Icon: MapPinIcon},
    ],
  },
];

interface Props {
  visible: boolean;
  /** Name of the active shift type — the sole "Work Log" tile. */
  shiftName: string;
  onSelect: (tileId: string) => void;
  onClose: () => void;
  /** Fired once the sheet's modal is gone — see BottomSheet's onClosed. */
  onClosed?: () => void;
}

const AddRequestsSheet: React.FC<Props> = ({
  visible,
  shiftName,
  onSelect,
  onClose,
  onClosed,
}) => {
  const renderTile = (tile: AddRequestTile) => (
    <TouchableOpacity
      key={tile.id}
      style={styles.tile}
      activeOpacity={0.85}
      onPress={() => onSelect(tile.id)}>
      <View style={styles.tileIcon}>
        <tile.Icon size={22} color={TILE_ICON} />
      </View>
      <Text style={styles.tileLabel}>{tile.label}</Text>
    </TouchableOpacity>
  );

  return (
    <BottomSheet
      visible={visible}
      title="Add Requests"
      onClose={onClose}
      onClosed={onClosed}>
      <Text style={styles.sectionTitle}>Work Log</Text>
      <View style={styles.grid}>
        {renderTile({id: 'work_log', label: shiftName, Icon: SprayCanIcon})}
      </View>

      {SECTIONS.map(section => (
        <View key={section.key}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.grid}>{section.tiles.map(renderTile)}</View>
        </View>
      ))}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: '#181B1F',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  tile: {
    width: '31%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  tileIcon: {
    height: 28,
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  tileLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: '#181B1F',
  },
});

export default AddRequestsSheet;
