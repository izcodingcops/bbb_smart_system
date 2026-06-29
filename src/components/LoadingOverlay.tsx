import React from 'react';
import {ActivityIndicator, View, Modal, Text, StyleSheet} from 'react-native';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<Props> = ({visible, message = 'Loading…'}) => (
  <Modal transparent animationType="fade" visible={visible}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  message: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#374151',
    marginTop: theme.spacing.md,
  },
});

export default LoadingOverlay;
