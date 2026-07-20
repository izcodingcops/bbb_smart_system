import React from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SectionTitle} from '../../../components/ui';
import {ArrowRightIcon} from '../../../components/icons';
import EquipmentCard from './EquipmentCard';
import {EquipmentItem} from '../../../types/equipment';
import {theme} from '../../../theme';

interface Props {
  items: EquipmentItem[];
  onViewAll?: () => void;
  onCheckout?: (item: EquipmentItem) => void;
}

const CheckedInEquipment: React.FC<Props> = ({items, onViewAll, onCheckout}) => {
  // Nothing checked in is the common case off-shift — drop the whole section
  // rather than leave a heading over empty space.
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <SectionTitle
        title="Checked-In Equipment"
        style={styles.title}
        action={
          <TouchableOpacity
            style={styles.viewAllRow}
            activeOpacity={0.7}
            onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
            <ArrowRightIcon size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <View>
        {items.map(item => (
          <EquipmentCard key={item.id} item={item} onCheckout={onCheckout} />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md},
  viewAllRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  viewAll: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
});

export default CheckedInEquipment;
