import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {theme} from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Rendered before the label (e.g. a play icon). */
  leadingIcon?: React.ReactNode;
  /** Rendered after the label (e.g. an arrow icon). */
  trailingIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Overrides the label type where a design calls for it. */
  labelStyle?: StyleProp<TextStyle>;
}

/**
 * The app's primary call-to-action: 56pt tall, 16 radius, primary blue with a
 * soft blue shadow. Greys out when disabled.
 */
const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  disabled = false,
  leadingIcon,
  trailingIcon,
  style,
  labelStyle,
}) => (
  <TouchableOpacity
    style={[styles.button, disabled && styles.disabled, style]}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}>
    {leadingIcon}
    <Text
      style={[styles.label, labelStyle, disabled && styles.disabledLabel]}>
      {label}
    </Text>
    {trailingIcon}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066B2',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 8,
  },
  disabled: {
    backgroundColor: '#DDE1E6',
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
  },
  disabledLabel: {color: '#9AA0A6'},
});

export default PrimaryButton;
