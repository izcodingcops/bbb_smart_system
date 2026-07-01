import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            testID="confirm-dialog-cancel"
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.7}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="confirm-dialog-confirm"
            style={[styles.button, destructive ? styles.destructiveButton : styles.confirmButton]}
            onPress={onConfirm}
            activeOpacity={0.7}>
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs + 2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  buttonRow: {flexDirection: 'row', gap: theme.spacing.md},
  button: {
    flex: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {backgroundColor: theme.colors.background},
  cancelText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
  },
  confirmButton: {backgroundColor: theme.colors.primaryDark},
  destructiveButton: {backgroundColor: theme.colors.error},
  confirmText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
  },
});

export default ConfirmDialog;
