import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../../theme';

interface Props {
  label: string;
  value?: string | null;
  /** Spans both grid columns of the caller's `.grid` layout. */
  full?: boolean;
  children?: React.ReactNode;
}

/** Label above value in a grid cell. Falls back to a muted "N/A". */
const DetailField: React.FC<Props> = ({label, value, full = false, children}) => (
  <View style={[styles.field, full && styles.fieldFull]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children ?? (
      <Text style={[styles.fieldValue, !value && styles.fieldValueEmpty]}>
        {value || 'N/A'}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  field: {width: '47%'},
  fieldFull: {width: '100%'},
  fieldLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: '#5B7290',
    marginBottom: 6,
  },
  fieldValue: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
  },
  fieldValueEmpty: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
});

export default DetailField;
