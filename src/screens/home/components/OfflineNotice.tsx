import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {WifiOffIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  pendingCount: number;
}

const OfflineNotice: React.FC<Props> = ({pendingCount}) => (
  <View style={styles.card}>
    <View style={styles.icon}>
      <WifiOffIcon size={20} color={theme.colors.textSecondary} />
    </View>
    <View style={styles.flex}>
      <Text style={styles.title}>It seems you're offline</Text>
      <Text style={styles.body}>
        Work will sync automatically once you're online.
      </Text>
    </View>
    <View style={styles.pill}>
      <Text style={styles.pillText}>{pendingCount} Pending</Text>
    </View>
  </View>
);

/** How far the card slides up behind the shift card above it. */
const TUCK = theme.spacing.md;

const styles = StyleSheet.create({
  flex: {flex: 1},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    // Hides this card's top edge behind the shift card, so that card's shadow
    // lands across it. The tuck is added back as padding to keep the content
    // clear of the overlap.
    marginTop: -TUCK,
    paddingTop: theme.spacing.md + TUCK,
    marginHorizontal: theme.spacing.lg,
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // Stays under the shift card's elevation (8) so Android keeps it behind.
    elevation: 4,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: '#E6E9ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: '#181B1F',
    marginBottom: 2,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  pill: {
    backgroundColor: '#F1F3F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default OfflineNotice;
