import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../theme';

const IncidentScreen: React.FC = () => (
  <SafeAreaView style={styles.root} edges={['top']}>
    <View style={[styles.root, theme.common.center]}>
      <Text style={styles.heading}>Incident</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  heading: {fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bold, color: '#9CA3AF'},
  sub: {fontSize: theme.fontSize.xs + 2, fontFamily: theme.fonts.regular, color: '#9CA3AF', marginTop: 4},
});

export default IncidentScreen;
