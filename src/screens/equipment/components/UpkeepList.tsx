import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {DetailField, DetailSection, detailGrid, formatDateTime} from '../../../components/ui';
import {EquipmentUpkeep} from '../../../types/equipment';
import {theme} from '../../../theme';

interface Props {
  upkeeps: EquipmentUpkeep[];
}

const UpkeepList: React.FC<Props> = ({upkeeps}) => {
  if (upkeeps.length === 0) {
    return (
      <View style={styles.emptyNote}>
        <Text style={styles.emptyText}>
          No upkeep records yet. Tap <Text style={styles.emptyBold}>Add Upkeep</Text> to
          log service, repairs or inspections for this equipment.
        </Text>
      </View>
    );
  }

  return (
    <>
      {upkeeps.map((upkeep, index) => (
        <DetailSection
          key={upkeep.id}
          title={
            upkeeps.length > 1
              ? `Upkeep ${index + 1} of ${upkeeps.length}`
              : 'Upkeep Details'
          }>
          <View style={detailGrid}>
            <DetailField label="Upkeep Type" value={upkeep.upkeepType} />
            <DetailField label="Date, Time" value={formatDateTime(upkeep.occurredAt)} />
            <DetailField label="Vendor" value={upkeep.vendor} />
            <DetailField label="Cost" value={upkeep.cost} />
            <DetailField label="Current Miles/Hours" value={upkeep.currentUsage} />
            <DetailField label="Zone" value={upkeep.zone} />
            <DetailField label="Description" value={upkeep.description} full />
          </View>
        </DetailSection>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  emptyNote: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 14,
    backgroundColor: theme.glass.chipFill,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
  },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  emptyBold: {fontFamily: theme.fonts.black, color: theme.colors.text},
});

export default UpkeepList;
