import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  /** Body copy. A node rather than a string so callers can bold names inline. */
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onCancel}>
    <TouchableWithoutFeedback onPress={onCancel}>
      <View style={styles.backdrop}>
        {/* Swallows taps on the card so they don't reach the dismissing scrim. */}
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.card}>
            <View style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancel]}
                activeOpacity={0.85}
                onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirm]}
                activeOpacity={0.85}
                onPress={onConfirm}>
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: '#F6EFD8',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    color: '#181B1F',
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {backgroundColor: '#F1F3F5'},
  cancelText: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: '#181B1F',
  },
  confirm: {backgroundColor: '#181B1F'},
  confirmText: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.white,
  },
});

export default ConfirmDialog;
