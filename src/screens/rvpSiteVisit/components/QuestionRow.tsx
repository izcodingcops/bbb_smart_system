import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {RvpAnswer} from '../../../types/rvpSiteVisit';
import {theme} from '../../../theme';

interface Props {
  answer: RvpAnswer;
}

/**
 * One answered question, read-only: the prompt, the Yes/No it was given, the
 * note a No carries, and any attached images.
 */
const QuestionRow: React.FC<Props> = ({answer}) => (
  <View style={styles.row}>
    <Text style={styles.question}>{answer.question}</Text>
    <Text
      style={[
        styles.answer,
        answer.answer === 'Yes' ? styles.answerYes : styles.answerNo,
      ]}>
      {answer.answer}
    </Text>
    {answer.note ? (
      <Text style={styles.note}>
        <Text style={styles.noteLabel}>Note: </Text>
        {answer.note}
      </Text>
    ) : null}
    {answer.images.length > 0 ? (
      <View style={styles.thumbs}>
        {answer.images.map(uri => (
          <Image key={uri} source={{uri}} style={styles.thumb} />
        ))}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  question: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  answer: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    marginTop: 5,
  },
  answerYes: {color: '#389E0D'},
  answerNo: {color: '#CF1322'},
  note: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  noteLabel: {fontFamily: theme.fonts.black, color: theme.colors.text},
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
  thumb: {width: 52, height: 52, borderRadius: theme.radius.md},
});

export default React.memo(QuestionRow);
