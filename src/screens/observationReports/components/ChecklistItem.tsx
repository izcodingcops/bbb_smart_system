import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ObservationChecklistItem} from '../../../types/observationReport';
import {theme} from '../../../theme';

const ChecklistItem: React.FC<{item: ObservationChecklistItem}> = ({item}) => (
  <View style={styles.row}>
    <Text style={styles.question}>{item.question}</Text>
    <Text style={styles.answer}>{item.answer}</Text>
    {item.note ? (
      <View style={styles.note}>
        <Text style={styles.noteText}>
          <Text style={styles.noteLabel}>Note: </Text>
          {item.note}
        </Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF0F2'},
  question: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: '#5B7290',
    lineHeight: 17,
    marginBottom: 6,
  },
  answer: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#252728',
    marginBottom: 10,
  },
  note: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
  },
  noteText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  noteLabel: {fontFamily: theme.fonts.black, color: theme.colors.text},
});

export default React.memo(ChecklistItem);
