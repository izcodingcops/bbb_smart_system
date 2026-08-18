import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  formChrome,
  SegmentedButtons,
  TextField,
  UploadField,
} from '../../../components/ui';
import {isNoteVisible} from '../../../graphql/features/offHoursVisit/hooks';
import {OffHoursQuestion} from '../../../types/offHoursVisit';
import {theme} from '../../../theme';

interface Props {
  /** Zero-based; the design numbers questions from 1. */
  index: number;
  question: OffHoursQuestion;
  answer: string;
  note: string;
  images: string[];
  onAnswer: (key: string, answer: string) => void;
  onNote: (key: string, note: string) => void;
  onImages: (key: string, images: string[]) => void;
}

/**
 * One scored checklist question: prompt, option pills, and — once answered —
 * a description box and an image attacher.
 *
 * Memoized because the form re-renders on every keystroke in any of the five
 * description boxes. Every callback reaching it is useCallback-stable and
 * takes the question key, so one handler serves all five without closing over
 * a per-question identity.
 */
const ChecklistQuestion: React.FC<Props> = ({
  index,
  question,
  answer,
  note,
  images,
  onAnswer,
  onNote,
  onImages,
}) => {
  const options = useMemo(
    () => question.options.map(o => ({value: o.label, label: o.label})),
    [question.options],
  );

  const showNote = isNoteVisible(question, answer);
  // Images are offered by every answer — only the description is conditional.
  const showImages = answer.length > 0;

  return (
    <View style={styles.block}>
      <Text style={styles.prompt}>
        {index + 1}. {question.prompt} <Text style={styles.required}>*</Text>
      </Text>
      {question.hint ? <Text style={styles.hint}>{question.hint}</Text> : null}

      <SegmentedButtons
        options={options}
        value={answer}
        onChange={next => onAnswer(question.key, next)}
        wrap={!question.numeric}
      />

      {showNote ? (
        <View style={styles.note}>
          <TextField
            placeholder="Add description"
            value={note}
            onChangeText={next => onNote(question.key, next)}
            multiline
            numberOfLines={3}
            style={formChrome.textarea}
          />
        </View>
      ) : null}

      {showImages ? (
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
    marginBottom: theme.spacing.xs,
  },
  // Matches FieldLabel's own asterisk, which is this literal rather than a token.
  required: {color: '#CF1322'},
  hint: {
    fontFamily: theme.fonts.regular,
    fontStyle: 'italic',
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 11,
  },
  note: {marginTop: 11},
});

export default React.memo(ChecklistQuestion);
