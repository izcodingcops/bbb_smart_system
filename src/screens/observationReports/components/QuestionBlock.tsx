import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {formChrome, SegmentedButtons, TextField} from '../../../components/ui';
import {theme} from '../../../theme';

const YES_NO = [
  {value: 'Yes', label: 'Yes'},
  {value: 'No', label: 'No'},
];

interface Props {
  /** Zero-based; the design numbers questions from 1. */
  index: number;
  prompt: string;
  answer: 'Yes' | 'No' | '';
  note: string;
  onAnswer: (answer: 'Yes' | 'No') => void;
  onNote: (note: string) => void;
  /**
   * True for the one question ("Was a training topic/scenario covered?")
   * whose note reveals on a Yes instead of a No, and asks what the topic
   * was rather than why the answer was No.
   */
  revealOnYes?: boolean;
}

/**
 * One checklist question: the prompt, a Yes/No row, and a note box that
 * reveals once answered — "Description" on a No for most questions, or
 * (for the training-topic question) "Training Topic / Scenario Covered" on
 * a Yes. Both write to the same per-question `note`, matching the seeded
 * data, which already stores a training topic in `checklist[4].note`
 * alongside every other question's "why not" text.
 */
const QuestionBlock: React.FC<Props> = ({
  index,
  prompt,
  answer,
  note,
  onAnswer,
  onNote,
  revealOnYes = false,
}) => {
  const options = useMemo(() => YES_NO, []);
  const showNote = revealOnYes ? answer === 'Yes' : answer === 'No';

  return (
    <>
      <Text style={styles.prompt}>
        {index + 1}. {prompt} <Text style={styles.required}>*</Text>
      </Text>

      <SegmentedButtons
        options={options}
        value={answer}
        onChange={next => onAnswer(next as 'Yes' | 'No')}
      />

      {showNote ? (
        <View style={styles.note}>
          <TextField
            placeholder={revealOnYes ? 'Enter training topic/scenario…' : 'Add description'}
            value={note}
            onChangeText={onNote}
            multiline
            numberOfLines={3}
            style={formChrome.textarea}
          />
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  prompt: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  // Matches FieldLabel's own asterisk, which is this literal rather than a token.
  required: {color: '#CF1322'},
  note: {marginTop: 11},
});

export default React.memo(QuestionBlock);
