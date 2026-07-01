import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../theme';

const MaintenanceDetailScreen: React.FC = () => (
  <View style={styles.root}>
    <Text style={styles.text}>Maintenance Detail</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center'},
  text: {fontFamily: theme.fonts.bold, color: theme.colors.text, fontSize: theme.fontSize.lg},
});

export default MaintenanceDetailScreen;
