import React from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {FieldLabel} from '../../../components/ui';
import {theme} from '../../../theme';

interface Props {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `−`/`+` stepper, min 1, two-digit zero-padded display — matches the source mockup's `.qty` control. */
const QuantityStepper: React.FC<Props> = ({label, value, onChange}) => {
  const numeric = Math.max(1, parseInt(value, 10) || 1);

  const step = (delta: number) => onChange(pad(Math.max(1, numeric + delta)));

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <View style={styles.qty}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => step(-1)}>
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{pad(numeric)}</Text>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => step(1)}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.lg},
  qty: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    width: 150,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
    overflow: 'hidden',
  },
  button: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7F9',
  },
  buttonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.text,
  },
  value: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.black,
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default QuantityStepper;
