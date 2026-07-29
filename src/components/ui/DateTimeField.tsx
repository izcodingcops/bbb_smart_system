import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import TimePickerSheet from '../TimePickerSheet';
import CalendarIcon from '../icons/CalendarIcon';
import {FieldLabel} from './DropdownField';
import {theme} from '../../theme';

interface Props {
  label: string;
  required?: boolean;
  /** ISO-8601. */
  value: string;
  onChange: (iso: string) => void;
  helpText?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** '04/06/2026, 10:54 AM' — the format the design shows. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ` +
    `${pad(hour12)}:${pad(date.getMinutes())} ${suffix}`
  );
}

/**
 * Auto-filled from the device clock, tappable to adjust. Tapping runs the date
 * picker and then the time picker, so one field covers both halves.
 */
const DateTimeField: React.FC<Props> = ({
  label,
  required = false,
  value,
  onChange,
  helpText = 'Auto-filled from your device — tap to adjust.',
}) => {
  const [stage, setStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [draft, setDraft] = useState<Date>(new Date(value));
  const [touched, setTouched] = useState(false);

  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity
        style={styles.control}
        activeOpacity={0.85}
        onPress={() => {
          setDraft(new Date(value));
          setStage('date');
        }}>
        <Text style={styles.value}>{formatDateTime(value)}</Text>
        {touched ? null : (
          <View style={styles.autoChip}>
            <Text style={styles.autoChipText}>AUTO</Text>
          </View>
        )}
        <CalendarIcon size={19} />
      </TouchableOpacity>
      <Text style={styles.help}>{helpText}</Text>

      <TimePickerSheet
        visible={stage === 'date'}
        mode="date"
        title="Select date"
        value={draft}
        onConfirm={date => {
          setDraft(date);
          setStage('time');
        }}
        onCancel={() => setStage('idle')}
      />
      <TimePickerSheet
        visible={stage === 'time'}
        mode="time"
        title="Select time"
        value={draft}
        onConfirm={time => {
          // Date half from the first picker, clock half from this one.
          const merged = new Date(draft);
          merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
          setTouched(true);
          setStage('idle');
          onChange(merged.toISOString());
        }}
        onCancel={() => setStage('idle')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.lg},
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#FBFCFD',
  },
  value: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  autoChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#B7EB8F',
    backgroundColor: '#F6FFED',
  },
  autoChipText: {
    fontFamily: theme.fonts.black,
    fontSize: 10,
    letterSpacing: 0.4,
    color: '#389E0D',
  },
  help: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: 7,
  },
});

export default DateTimeField;
