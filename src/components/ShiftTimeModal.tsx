import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import BottomSheet from './BottomSheet';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onConfirm: (startTime: Date, endTime: Date) => void;
  onClose: () => void;
  timeZone?: string;
}

const formatTime = (date: Date, timeZone?: string): string =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  });

const formatDate = (date: Date, timeZone?: string): string =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  });

const ShiftTimeModal: React.FC<Props> = ({visible, isLoading, onConfirm, onClose, timeZone}) => {
  const [startTime] = useState(() => new Date());
  const [endTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d;
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shift Hours</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.timeRow}>
          <View style={[styles.timeCard, styles.startCard]}>
            <Text style={[styles.timeLabel, {color: '#3B82F6'}]}>START TIME</Text>
            <Text style={[styles.timeValue, {color: theme.colors.primaryDark}]}>
              {formatTime(startTime, timeZone)}
            </Text>
            <Text style={styles.dateValue}>{formatDate(startTime, timeZone)}</Text>
          </View>
          <View style={[styles.timeCard, styles.endCard]}>
            <Text style={[styles.timeLabel, {color: theme.colors.success}]}>END TIME</Text>
            <Text style={[styles.timeValue, {color: '#15803D'}]}>
              {formatTime(endTime, timeZone)}
            </Text>
            <Text style={styles.dateValue}>{formatDate(endTime, timeZone)}</Text>
          </View>
        </View>

        <Text style={styles.hint}>8-hour shift starting now</Text>

        <TouchableOpacity
          onPress={() => onConfirm(startTime, endTime)}
          disabled={isLoading}
          style={[styles.confirmBtn, isLoading && styles.disabledBtn]}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.confirmText}>Start Shift</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  closeBtn: {padding: theme.spacing.xs},
  closeText: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
  body: {padding: theme.spacing.xl, gap: 16},
  timeRow: {flexDirection: 'row', gap: theme.spacing.md},
  timeCard: {
    flex: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
  },
  startCard: {backgroundColor: '#F0F5FF', borderColor: '#DBEAFE'},
  endCard: {backgroundColor: '#F0FFF4', borderColor: '#BBF7D0'},
  timeLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs,
  },
  timeValue: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bold,
  },
  dateValue: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledBtn: {opacity: 0.6},
  confirmText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
  },
});

export default ShiftTimeModal;
