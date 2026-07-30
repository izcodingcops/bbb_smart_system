import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import BottomSheet from './BottomSheet';
import TimePickerSheet from '../TimePickerSheet';
import {CalendarIcon} from '../icons';
import {
  CUSTOM_RANGE_VALUE,
  DATE_RANGE_OPTIONS,
  encodeCustomRange,
  parseCustomRange,
} from '../../utils/dateRange';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  /** Currently applied value, or null when the chip is clear. */
  value: string | null;
  onApply: (value: string | null) => void;
  onClose: () => void;
}

/** '2026-07-01' — the encoded half of a custom range. */
function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function label(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Radio list of relative ranges. "Custom range…" reveals a From/To pair rather
 * than committing, so the sheet needs its own Apply footer.
 */
const DateRangeSheet: React.FC<Props> = ({visible, value, onApply, onClose}) => {
  const existing = value ? parseCustomRange(value) : null;
  const [choice, setChoice] = useState<string | null>(
    existing ? CUSTOM_RANGE_VALUE : value,
  );
  const [from, setFrom] = useState<string>(
    existing?.from ?? toISODate(new Date()),
  );
  const [to, setTo] = useState<string>(existing?.to ?? toISODate(new Date()));
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);

  // Re-seed on each open so a dismissed sheet doesn't keep a stale draft.
  useEffect(() => {
    if (visible) {
      const current = value ? parseCustomRange(value) : null;
      setChoice(current ? CUSTOM_RANGE_VALUE : value);
      setFrom(current?.from ?? toISODate(new Date()));
      setTo(current?.to ?? toISODate(new Date()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const commit = () => {
    if (choice === null) {
      onApply(null);
    } else if (choice === CUSTOM_RANGE_VALUE) {
      // Tolerate a backwards range rather than rejecting it.
      onApply(
        from <= to ? encodeCustomRange(from, to) : encodeCustomRange(to, from),
      );
    } else {
      onApply(choice);
    }
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Filter by Date Range" onClose={onClose}>
      {DATE_RANGE_OPTIONS.map(option => {
        const selected = choice === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setChoice(option.value)}>
            <Text style={styles.label}>{option.label}</Text>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
          </TouchableOpacity>
        );
      })}

      {choice === CUSTOM_RANGE_VALUE ? (
        <View style={styles.range}>
          {(['from', 'to'] as const).map(edge => (
            <TouchableOpacity
              key={edge}
              style={styles.rangeField}
              activeOpacity={0.85}
              onPress={() => setPicking(edge)}>
              <Text style={styles.rangeLabel}>
                {edge === 'from' ? 'From' : 'To'}
              </Text>
              <View style={styles.rangeValueRow}>
                <Text style={styles.rangeValue}>
                  {label(edge === 'from' ? from : to)}
                </Text>
                <CalendarIcon size={17} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.reset]}
          activeOpacity={0.85}
          onPress={() => {
            onApply(null);
            onClose();
          }}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.apply]}
          activeOpacity={0.85}
          onPress={commit}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <TimePickerSheet
        visible={picking !== null}
        mode="date"
        title={picking === 'to' ? 'To date' : 'From date'}
        value={new Date(`${picking === 'to' ? to : from}T00:00:00`)}
        onConfirm={date => {
          if (picking === 'to') {
            setTo(toISODate(date));
          } else {
            setFrom(toISODate(date));
          }
          setPicking(null);
        }}
        onCancel={() => setPicking(null)}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {fontFamily: theme.fonts.bold, fontSize: 15, color: '#181B1F'},
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#D7DBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {borderColor: theme.colors.primary},
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  range: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  rangeField: {
    flex: 1,
    gap: 6,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  rangeLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  rangeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  rangeValue: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: '#181B1F',
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reset: {backgroundColor: '#F1F3F5'},
  resetText: {fontFamily: theme.fonts.black, fontSize: 15, color: '#181B1F'},
  apply: {backgroundColor: theme.colors.primary},
  applyText: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.white,
  },
});

export default DateRangeSheet;
