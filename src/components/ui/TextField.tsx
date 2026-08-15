import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import {theme} from '../../theme';

interface Props extends TextInputProps {
  /** Uppercase micro-label above the field. */
  label?: string;
  /** Rendered inside the field, before the input. */
  leadingIcon?: React.ReactNode;
  /** Rendered inside the field, after the input (e.g. a visibility toggle). */
  trailingIcon?: React.ReactNode;
  error?: string;
  centered?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Overrides the bordered box around the input — the list search rows use it
   * to swap the solid white fill for the glass one. Forms leave it unset.
   */
  wrapStyle?: StyleProp<ViewStyle>;
}

const TextField: React.FC<Props> = ({
  label,
  leadingIcon,
  trailingIcon,
  error,
  centered = false,
  containerStyle,
  wrapStyle,
  style,
  ...inputProps
}) => (
  <View style={containerStyle}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={[styles.wrap, wrapStyle, error ? styles.wrapError : null]}>
      {leadingIcon}
      <TextInput
        style={[styles.input, centered && styles.inputCentered, style]}
        placeholderTextColor={theme.colors.textMuted}
        {...inputProps}
      />
      {trailingIcon}
    </View>
    {error ? (
      <View style={[styles.errorRow, centered && styles.errorRowCentered]}>
        <AlertTriangleIcon size={15} color={theme.colors.error} />
        <Text style={styles.error}>{error}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    lineHeight: 12,
    fontFamily: theme.fonts.black,
    color: theme.colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  // The design gives text inputs, dropdowns and textareas one shared field
  // token — `--field-bg: #f4f5f7`, on a 1.5px `--border` outline — so a form
  // mixing a TextField and a DropdownField reads as one control set. This
  // used to be white on a near-invisible #EEF0F2 outline, which made the
  // dropdowns beside it look like the odd ones out when in fact they were the
  // only ones following the design.
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#F4F5F7',
  },
  wrapError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    // No lineHeight: matching it to fontSize collapses the line box on iOS and
    // rides the text off-centre against the icons the row centres.
    fontFamily: theme.fonts.bold,
    color: '#1A1C1E',
  },
  inputCentered: {textAlign: 'center'},
  errorRow: {
    flexDirection: 'row',
    // Top-aligned, not centred: the icon should sit against the first line
    // when the message wraps to two.
    alignItems: 'flex-start',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  errorRowCentered: {justifyContent: 'center'},
  error: {
    flexShrink: 1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.error,
    fontSize: 13,
    lineHeight: 17,
  },
});

export default TextField;
