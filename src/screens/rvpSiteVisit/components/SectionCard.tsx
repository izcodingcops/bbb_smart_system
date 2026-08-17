import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
import {CheckIcon, ChevronRightIcon} from '../../../components/icons';
import {RvpSection, RvpSectionValues} from '../../../types/rvpSiteVisit';
import {theme} from '../../../theme';

interface Props {
  section: RvpSection;
  values: RvpSectionValues | undefined;
  questionCount: number;
  onPress: (key: string) => void;
}

/** Not started → partially answered → saved. */
function stateOf(values: RvpSectionValues | undefined, total: number) {
  const answered = values ? Object.keys(values.answers).length : 0;
  if (!values || answered === 0) {
    return {kind: 'todo' as const, answered};
  }
  if (values.saved && answered >= total) {
    return {kind: 'saved' as const, answered};
  }
  return {kind: 'part' as const, answered};
}

const SectionCard: React.FC<Props> = ({
  section,
  values,
  questionCount,
  onPress,
}) => {
  const state = stateOf(values, questionCount);
  const score = values
    ? Object.values(values.answers).filter(a => a === 'Yes').length
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(section.key)}>
      <Card glass style={styles.card}>
        <View style={styles.text}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.subtitle}>{section.subtitle}</Text>

          {state.kind === 'saved' ? (
            <View style={[styles.pill, styles.pillSaved]}>
              <CheckIcon size={12} color="#389E0D" />
              <Text style={[styles.pillText, styles.pillTextSaved]}>Saved</Text>
            </View>
          ) : state.kind === 'part' ? (
            <View style={[styles.pill, styles.pillPart]}>
              <Text style={[styles.pillText, styles.pillTextPart]}>
                {state.answered} of {questionCount} answered
              </Text>
            </View>
          ) : (
            <View style={[styles.pill, styles.pillTodo]}>
              <Text style={[styles.pillText, styles.pillTextTodo]}>
                Not started
              </Text>
            </View>
          )}
        </View>

        <View style={styles.right}>
          <Text
            style={[styles.score, state.kind === 'todo' && styles.scoreOff]}>
            {score}/{questionCount}
          </Text>
          <ChevronRightIcon size={18} color={theme.colors.textMuted} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  text: {flex: 1, minWidth: 0, gap: 3},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 999,
    marginTop: 5,
  },
  pillSaved: {backgroundColor: '#F6FFED'},
  pillPart: {backgroundColor: '#FFFBE6'},
  pillTodo: {backgroundColor: '#F1F3F5'},
  pillText: {fontFamily: theme.fonts.black, fontSize: 11},
  pillTextSaved: {color: '#389E0D'},
  pillTextPart: {color: '#AD8B00'},
  pillTextTodo: {color: '#475467'},
  right: {flexDirection: 'row', alignItems: 'center', gap: 6},
  score: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  scoreOff: {color: theme.colors.textMuted},
});

export default React.memo(SectionCard);
