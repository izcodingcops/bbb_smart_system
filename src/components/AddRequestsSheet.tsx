import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import BottomSheet from './ui/BottomSheet';
import {theme} from '../theme';

export interface AddRequestTile {
  id: string;
  label: string;
  tint: string;
}

/**
 * Static half of the sheet. The "Work Log" section is left out because its one
 * tile is the shift the user is actually on, which only the caller knows.
 */
const SECTIONS: {key: string; title: string; tiles: AddRequestTile[]}[] = [
  {
    key: 'create',
    title: 'Create New',
    tiles: [
      {id: 'maintenance', label: 'Maintenance', tint: '#FDE8E4'},
      {id: 'fixture', label: 'Fixture', tint: '#E4EEFD'},
      {id: 'incident', label: 'Incident', tint: '#FDF3E4'},
      {id: 'poi', label: 'POI', tint: '#E7F7EC'},
    ],
  },
  {
    key: 'equipment',
    title: 'Equipment',
    tiles: [
      {id: 'check_in', label: 'Check In', tint: '#E4EEFD'},
      {id: 'check_out', label: 'Check Out', tint: '#EFE7FB'},
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
      <View style={[styles.tileIcon, {backgroundColor: tile.tint}]} />
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
        {renderTile({id: 'work_log', label: shiftName, tint: '#E7F7EC'})}
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
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xl,
  },
  tileLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: '#181B1F',
  },
});

export default AddRequestsSheet;
