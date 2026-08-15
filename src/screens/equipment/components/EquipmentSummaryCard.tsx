import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card, formatCardDateOnly} from '../../../components/ui';
import {Equipment} from '../../../types/equipment';
import {theme} from '../../../theme';

interface Cell {
  label: string;
  value: string;
}

interface Props {
  equipment: Equipment;
  /** Adds the Checked Out Date cell and the "checked out by you" note. */
  showCheckedOut?: boolean;
}

/**
 * The block every equipment form shows above its fields, identifying the
 * record being acted on — a two-column grid of Name / Type / Category, plus
 * Checked Out Date when the caller opts in.
 */
const EquipmentSummaryCard: React.FC<Props> = ({
  equipment,
  showCheckedOut = false,
}) => {
  const cells: Cell[] = [
    {label: 'Name', value: equipment.name},
    {label: 'Type', value: equipment.equipmentType},
    {label: 'Category', value: equipment.category},
  ];
  if (showCheckedOut) {
    cells.push({
      label: 'Checked Out Date',
      value: equipment.checkedOutAt
        ? formatCardDateOnly(equipment.checkedOutAt)
        : '—',
    });
  }
  // The mockup spans the last cell full-width whenever the count is odd —
  // driven by the count so a later slice can add a cell without a rewrite.
  const spanLast = cells.length % 2 === 1;

  return (
    <Card glass style={styles.card}>
      <View style={styles.grid}>
        {cells.map((cell, index) => (
          <View
            key={cell.label}
            style={[
              styles.cell,
              index === cells.length - 1 && spanLast && styles.cellFull,
            ]}>
            <Text style={styles.label}>{cell.label}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {cell.value}
            </Text>
          </View>
        ))}
      </View>
      {showCheckedOut ? (
        <Text style={styles.note}>
          {equipment.name} is checked out by you
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {gap: theme.spacing.md},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.spacing.md,
    rowGap: theme.spacing.md,
  },
  cell: {flexGrow: 1, flexBasis: '45%', minWidth: 0},
  cellFull: {flexBasis: '100%'},
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textOnGlassMuted,
    marginBottom: 4,
  },
  value: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textOnGlass,
  },
  note: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textOnGlassMuted,
  },
});

export default EquipmentSummaryCard;
