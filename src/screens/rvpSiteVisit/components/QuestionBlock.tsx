import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  formChrome,
  SegmentedButtons,
  TextField,
  UploadField,
} from '../../../components/ui';
import {RvpAnswerValue, RvpQuestion} from '../../../types/rvpSiteVisit';
import {theme} from '../../../theme';

const YES_NO = [
  {value: 'Yes', label: 'Yes'},
  {value: 'No', label: 'No'},
];

interface Props {
  /** Zero-based; the design numbers questions from 1. */
  index: number;
  question: RvpQuestion;
  answer: RvpAnswerValue | '';
  note: string;
  images: string[];
  onAnswer: (key: string, answer: RvpAnswerValue) => void;
  onNote: (key: string, note: string) => void;
  onImages: (key: string, images: string[]) => void;
}

/**
 * One scored question: the prompt, a Yes/No row, and — once answered — an
 * image attacher, plus a note box on a No.
 *
 * Memoized, and this matters more here than anywhere else in the app: one
 * section editor holds up to eighteen of these and re-renders on every
 * keystroke in any note. Every callback reaching it is useCallback-stable and
 * takes the question key, so one handler serves all eighteen.
 */
const QuestionBlock: React.FC<Props> = ({
  index,
  question,
  answer,
  note,
  images,
  onAnswer,
  onNote,
  onImages,
}) => {
  const options = useMemo(() => YES_NO, []);

  return (
    <View style={styles.block}>
      <Text style={styles.prompt}>
        {index + 1}. {question.prompt} <Text style={styles.required}>*</Text>
      </Text>

      <SegmentedButtons
        options={options}
        value={answer}
        onChange={next => onAnswer(question.key, next as RvpAnswerValue)}
      />

      {/* The note is optional even on a No — the design says so on the box. */}
      {answer === 'No' ? (
        <View style={styles.note}>
          <TextField
            placeholder="Add note (optional)"
            value={note}
            onChangeText={next => onNote(question.key, next)}
            multiline
            numberOfLines={3}
            style={formChrome.textarea}
          />
        </View>
      ) : null}

      {answer ? (
        <UploadField
          compact
          title="Add Images"
          uris={images}
          onChange={next => onImages(question.key, next)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {marginBottom: theme.spacing.xl},
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
