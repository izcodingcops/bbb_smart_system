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
}

const TextField: React.FC<Props> = ({
  label,
  leadingIcon,
  trailingIcon,
  error,
  centered = false,
  containerStyle,
  style,
  ...inputProps
}) => (
  <View style={containerStyle}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={[styles.wrap, error ? styles.wrapError : null]}>
      {leadingIcon}
      <TextInput
        style={[styles.input, centered && styles.inputCentered, style]}
        placeholderTextColor={theme.colors.textMuted}
        {...inputProps}
      />
      {trailingIcon}
    </View>
    {error ? (
      <Text style={[styles.error, centered && styles.errorCentered]}>
        {error}
      </Text>
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
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  wrapError: {borderColor: theme.colors.error},
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: theme.fonts.bold,
    color: '#1A1C1E',
  },
  inputCentered: {textAlign: 'center'},
  error: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
  },
  errorCentered: {textAlign: 'center'},
});

export default TextField;
