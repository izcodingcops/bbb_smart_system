import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Card from '../../../components/ui/Card';
import {WifiOffIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  pendingCount: number;
  /** Items that gave up syncing. Adds a warning line when above zero. */
  failedCount?: number;
}

const OfflineNotice: React.FC<Props> = ({pendingCount, failedCount = 0}) => (
  <Card glass style={styles.card}>
    <View style={styles.icon}>
      <WifiOffIcon size={20} color={theme.colors.textOnGlassSubtle} />
    </View>
    <View style={styles.flex}>
      <Text style={styles.title}>It seems you're offline</Text>
      <Text style={styles.body}>
        Work will sync automatically once you're online.
      </Text>
      {failedCount > 0 && (
        <Text style={styles.failed}>
          {failedCount} {failedCount === 1 ? 'item' : 'items'} couldn't sync.
        </Text>
      )}
    </View>
    <View style={styles.pill}>
      <Text style={styles.pillText}>{pendingCount} Pending</Text>
    </View>
  </Card>
);

/** How far the card slides up behind the shift card above it. */
const TUCK = theme.spacing.md;

const styles = StyleSheet.create({
  flex: {flex: 1},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    // Hides this card's top edge behind the shift card, so that card's shadow
    // lands across it. The tuck is added back as padding to keep the content
    // clear of the overlap.
    marginTop: -TUCK,
    paddingTop: theme.spacing.lg + TUCK,
    marginHorizontal: theme.spacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: theme.glass.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.textOnGlass,
    marginBottom: 2,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textOnGlassMuted,
  },
  failed: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 2,
  },
  pill: {
    backgroundColor: theme.glass.chipFill,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.textOnGlassSubtle,
  },
});

export default OfflineNotice;
