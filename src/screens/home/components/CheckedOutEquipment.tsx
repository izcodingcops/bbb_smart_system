import React from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SectionTitle} from '../../../components/ui';
import {ArrowRightIcon} from '../../../components/icons';
import EquipmentCard from './EquipmentCard';
import EquipmentCardSkeleton from './EquipmentCardSkeleton';
import {Equipment} from '../../../types/equipment';
import {theme} from '../../../theme';

const SKELETON_CARDS = [0, 1];

interface Props {
  items: Equipment[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onCheckIn?: (item: Equipment) => void;
}

const CheckedOutEquipment: React.FC<Props> = ({items, isLoading, onViewAll, onCheckIn}) => {
  // Nothing checked in is the common case off-shift — drop the whole section
  // rather than leave a heading over empty space. Loading is exempt: the
  // empty array is just "no data yet", not "confirmed nothing checked in".
  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <>
      <SectionTitle
        title="Checked-Out Equipment"
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
        {isLoading
          ? SKELETON_CARDS.map(index => <EquipmentCardSkeleton key={index} />)
          : items.map(item => (
              <EquipmentCard key={item.id} item={item} onCheckIn={onCheckIn} />
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

export default CheckedOutEquipment;
