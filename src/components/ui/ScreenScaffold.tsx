import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {Edge} from 'react-native-safe-area-context';
import ScreenBackground from '../ScreenBackground';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import {theme} from '../../theme';

interface Props {
  children: React.ReactNode;
  /** Shows a circular back button top-left. */
  onBack?: () => void;
  /** Rendered on the right of the top row (e.g. a step indicator). */
  topRight?: React.ReactNode;
  title?: string;
  subtitle?: React.ReactNode;
  edges?: Edge[];
}

/**
 * Standard screen chrome: app background, safe area, an optional back button /
 * top-right slot, and the title+subtitle block. Screens supply only their body.
 */
const ScreenScaffold: React.FC<Props> = ({
  children,
  onBack,
  topRight,
  title,
  subtitle,
  edges = ['top', 'bottom'],
}) => (
  <ScreenBackground style={styles.root}>
    <SafeAreaView style={styles.flex} edges={edges}>
      {onBack || topRight ? (
        <View style={styles.topRow}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={onBack}>
              <ChevronLeftIcon size={22} color="#181B1F" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          {topRight}
        </View>
      ) : null}

      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {children}
    </SafeAreaView>
  </ScreenBackground>
);

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  backPlaceholder: {width: 40, height: 40},
  header: {
    paddingHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 26,
    lineHeight: 26,
    letterSpacing: -0.6,
    fontFamily: theme.fonts.black,
    color: '#181B1F',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: theme.fonts.bold,
    color: '#5B5F66',
  },
});

export default ScreenScaffold;
