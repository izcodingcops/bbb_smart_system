import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, Skeleton} from '../../../components/ui';
import {theme} from '../../../theme';

/** Loading placeholder shaped like EquipmentCard — icon tile, name/category/time, badge+button. */
const EquipmentCardSkeleton: React.FC = () => (
  <Card style={styles.card}>
    <View style={styles.row}>
      <Skeleton width={44} height={44} radius={theme.radius.md} />

      <View style={styles.info}>
        <Skeleton width="70%" height={15.5} />
        <Skeleton width="45%" height={13} style={styles.spaced} />
        <Skeleton width={90} height={12.5} style={styles.spaced} />
      </View>

      <View style={styles.right}>
        <Skeleton width={64} height={22} radius={999} />
        <Skeleton width={84} height={32} radius={theme.radius.md} />
      </View>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  row: {flexDirection: 'row', gap: theme.spacing.md},
  info: {flex: 1, justifyContent: 'center', gap: 6},
  spaced: {marginTop: 2},
  right: {alignItems: 'flex-end', justifyContent: 'space-between'},
});

export default EquipmentCardSkeleton;
