import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {theme} from '../theme';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  testID?: string;
}

function formatDateTime(date: Date): string {
  const datePart = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
  const timePart = date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
  return `${datePart}, ${timePart}`;
}

const DateTimeField: React.FC<Props> = ({label, value, onChange, testID = 'datetime-field'}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        testID={`${testID}-trigger`}
        style={styles.input}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.7}>
        <Text style={styles.value}>{formatDateTime(value)}</Text>
      </TouchableOpacity>
      {pickerVisible && (
        <DateTimePicker
          testID={`${testID}-picker`}
          value={value}
          mode="datetime"
          display="default"
          onChange={(_event, selectedDate) => {
            setPickerVisible(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: theme.fontSize.xs + 2,
    fontFamily: theme.fonts.bold,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  value: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#111827',
  },
});

export default DateTimeField;
