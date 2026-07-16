import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import {theme} from '../theme';

interface Props {
  title?: string;
}

/**
 * Stand-in for menu entries that don't have a screen yet, so tapping a tab
 * doesn't silently render Home.
 */
const ComingSoonScreen: React.FC<Props> = ({title = 'Coming soon'}) => (
  <ScreenBackground style={styles.root}>
    <SafeAreaView style={styles.center} edges={['top']}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>This section isn't available yet.</Text>
      <View />
    </SafeAreaView>
  </ScreenBackground>
);

const styles = StyleSheet.create({
  root: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 20,
    color: '#181B1F',
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textSecondary,
  },
});

export default ComingSoonScreen;
