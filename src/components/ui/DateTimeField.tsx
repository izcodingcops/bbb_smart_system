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
 * 'Jul 6, 2026 · 08:40 AM' — the list-card format. The hour is padded by hand
 * because en-US drops the leading zero even with `hour: '2-digit'`, which loses
 * the design's column alignment.
 */
export function formatCardDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${day} · ${pad(hour12)}:${pad(date.getMinutes())} ${suffix}`;
}

/**
 * Auto-filled from the device clock, tappable to adjust. Tapping runs the date
 * picker and then the time picker, so one field covers both halves.
 *
 * Both steps share a single TimePickerSheet instance, switching its `mode`
 * prop rather than swapping between two separate ones. Two <Modal>s can't be
 * visible on iOS at the same moment — even for one frame while one animates
 * out as the other animates in — so mounting a second Modal to show the time
 * step silently dropped it. Keeping one Modal open throughout and only
 * changing what it displays avoids that entirely.
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
        visible={stage !== 'idle'}
        mode={stage === 'date' ? 'date' : 'time'}
        title={stage === 'date' ? 'Select date' : 'Select time'}
        value={draft}
        onConfirm={picked => {
          if (stage === 'date') {
            // Date half chosen — keep the sheet open and switch to the time
            // step; the user hasn't finished yet, so nothing commits.
            setDraft(picked);
            setStage('time');
            return;
          }
          // Time half chosen — merge onto the date half already picked and
          // commit both together.
          const merged = new Date(draft);
          merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
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
