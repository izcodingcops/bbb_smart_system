import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {StatusPill} from '../../../components/ui';
import {ObservationChecklistItem} from '../../../types/observationReport';
import {theme} from '../../../theme';

const ANSWER_STYLE: Record<ObservationChecklistItem['answer'], {bg: string; fg: string}> = {
  Yes: {bg: '#F6FFED', fg: '#389E0D'},
  No: {bg: '#FFF2F0', fg: '#CF1322'},
  'N/A': {bg: '#F1F3F5', fg: '#475467'},
};

const ChecklistItem: React.FC<{item: ObservationChecklistItem}> = ({item}) => {
  const style = ANSWER_STYLE[item.answer];
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={styles.question}>{item.question}</Text>
        <StatusPill label={item.answer} bg={style.bg} fg={style.fg} />
      </View>
      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF0F2'},
  head: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.md},
  question: {flex: 1, fontFamily: theme.fonts.bold, fontSize: 14, color: '#181B1F'},
  note: {fontFamily: theme.fonts.bold, fontSize: 12.5, color: theme.colors.textSecondary},
});

export default React.memo(ChecklistItem);
