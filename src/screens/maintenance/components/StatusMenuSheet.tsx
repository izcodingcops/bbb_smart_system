import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {BottomSheet} from '../../../components/ui';
import {MaintenanceRequest, MaintenanceStatus} from '../../../types/maintenance';
import {theme} from '../../../theme';

interface Props {
  /** The record whose status is being changed; null keeps the sheet closed. */
  request: MaintenanceRequest | null;
  onSelect: (status: MaintenanceStatus) => void;
  onClose: () => void;
  /** Fired once the native modal is gone — see BottomSheet's onClosed. */
  onClosed?: () => void;
}

const OPTIONS: {status: MaintenanceStatus; label: string; dot: string}[] = [
  {status: 'In-progress', label: 'Move to In-progress', dot: '#AD8B00'},
  {status: 'Completed', label: 'Mark Completed', dot: '#389E0D'},
];

/**
 * An Open record can move either way; an In-progress one can only be
 * completed — so the first row drops out once work has started.
 */
const StatusMenuSheet: React.FC<Props> = ({
  request,
  onSelect,
  onClose,
  onClosed,
}) => {
  const options =
    request?.status === 'Open'
      ? OPTIONS
      : OPTIONS.filter(option => option.status === 'Completed');

  return (
    <BottomSheet
      visible={!!request}
      title="Change status"
      onClose={onClose}
      onClosed={onClosed}>
      {options.map(option => (
        <TouchableOpacity
          key={option.status}
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => onSelect(option.status)}>
          <View style={[styles.dot, {backgroundColor: option.dot}]} />
          <Text style={styles.label}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dot: {width: 9, height: 9, borderRadius: 5},
  label: {fontFamily: theme.fonts.bold, fontSize: 15, color: '#181B1F'},
});

export default StatusMenuSheet;
