import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ObservationReportType} from '../../../types/observationReport';
import {theme} from '../../../theme';

interface Props {
  tab: ObservationReportType;
  ambassadorCount: number;
  supervisorCount: number;
  onChange: (tab: ObservationReportType) => void;
}

const ReportTabSwitcher: React.FC<Props> = ({tab, ambassadorCount, supervisorCount, onChange}) => {
  const renderTab = (value: ObservationReportType, label: string, count: number) => {
    const active = tab === value;
    return (
      <TouchableOpacity
        style={[styles.tab, active && styles.tabActive]}
        activeOpacity={0.85}
        onPress={() => onChange(value)}>
        <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
        <View style={[styles.count, active && styles.countActive]}>
          <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.row}>
      {renderTab('Ambassador', 'Ambassador', ambassadorCount)}
      {renderTab('Supervisor', 'Supervisor', supervisorCount)}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: '#EAECEF',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 11,
  },
  tabActive: {backgroundColor: theme.colors.white, ...theme.shadow.card},
  tabText: {fontFamily: theme.fonts.bold, fontSize: 13, color: theme.colors.textSecondary},
  tabTextActive: {color: theme.colors.primary, fontFamily: theme.fonts.black},
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DDE1E6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countActive: {backgroundColor: theme.colors.primaryLight},
  countText: {fontFamily: theme.fonts.black, fontSize: 11, color: theme.colors.textSecondary},
  countTextActive: {color: theme.colors.primary},
});

export default ReportTabSwitcher;
