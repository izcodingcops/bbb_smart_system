import React, {useCallback, useMemo, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  DateTimeField,
  FieldLabel,
  formChrome,
  ScrollableTabs,
  TextField,
} from '../../../components/ui';
import {StarIcon, XIcon} from '../../../components/icons';
import {
  RvpAnswerValue,
  RvpSection,
  RvpSectionValues,
} from '../../../types/rvpSiteVisit';
import QuestionBlock from './QuestionBlock';
import {theme} from '../../../theme';

interface Props {
  section: RvpSection;
  values: RvpSectionValues;
  /**
   * Takes an updater rather than the next value. That is what lets the
   * per-question handlers below stay `useCallback`-stable — closing over
   * `values` would give all three a new identity on every keystroke and make
   * QuestionBlock's memo inert across eighteen blocks.
   */
  onChange: (update: (current: RvpSectionValues) => RvpSectionValues) => void;
  onSave: () => void;
  onClose: () => void;
}

/**
 * A section's questions, filling the screen over the form.
 *
 * The design opens this as a near-full-height bottom sheet. That primitive here
 * is built for filter and select lists, and an eighteen-question form with
 * textareas and image pickers inside one fights the iOS keyboard — so this
 * takes the screen the way ViewFixtureScreen's edit swap does.
 *
 * Holds no answer state of its own: the form owns everything, so closing and
 * reopening a section keeps what was typed. The only local state is which group
 * tab is active.
 */
const SectionEditor: React.FC<Props> = ({
  section,
  values,
  onChange,
  onSave,
  onClose,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const groupOffsets = useRef<Record<string, number>>({});
  const [activeGroup, setActiveGroup] = useState(section.groups[0]?.key ?? '');

  const questionCount = useMemo(
    () => section.groups.reduce((n, g) => n + g.questions.length, 0),
    [section],
  );
  const answeredCount = Object.keys(values.answers).length;
  const score = useMemo(
    () => Object.values(values.answers).filter(a => a === 'Yes').length,
    [values.answers],
  );

  /*
   * One handler per map rather than a closure per question, and each depends on
   * `onChange` alone — never on `values`. That is what keeps their identity
   * stable across keystrokes, which is what makes QuestionBlock's memo do
   * anything at all when a section holds eighteen of them.
   */
  const handleAnswer = useCallback(
    (key: string, answer: RvpAnswerValue) => {
      onChange(current => ({
        ...current,
        answers: {...current.answers, [key]: answer},
      }));
    },
    [onChange],
  );

  const handleNote = useCallback(
    (key: string, note: string) => {
      onChange(current => ({...current, notes: {...current.notes, [key]: note}}));
    },
    [onChange],
  );

  const handleImages = useCallback(
    (key: string, images: string[]) => {
      onChange(current => ({
        ...current,
        images: {...current.images, [key]: images},
      }));
    },
    [onChange],
  );

  const handleObserved = (groupKey: string, half: 'from' | 'to', iso: string) => {
    onChange(current => ({
      ...current,
      observed: {
        ...current.observed,
        [groupKey]: {
          ...(current.observed[groupKey] ?? {from: '', to: ''}),
          [half]: iso,
        },
      },
    }));
  };

  const tabs = useMemo(
    () =>
      section.groups.map(group => ({
        key: group.key,
        // First two words plus an ellipsis, as the design's tab strip does.
        label:
          group.title.trim().split(/\s+/).length > 2
            ? `${group.title.trim().split(/\s+/).slice(0, 2).join(' ')}…`
            : group.title,
      })),
    [section.groups],
  );

  const jumpToGroup = (key: string) => {
    setActiveGroup(key);
    const y = groupOffsets.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({y: Math.max(0, y - 8), animated: true});
    }
  };

  let questionIndex = -1;

  return (
    <ScreenBackground style={formChrome.root}>
      <SafeAreaView edges={['top']} style={formChrome.topbar}>
        <View style={formChrome.topbarRow}>
          {/* The only way out of this overlay — it must always render. */}
          <TouchableOpacity
            style={formChrome.topbarButton}
            activeOpacity={0.8}
            onPress={onClose}>
            <XIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title} numberOfLines={1}>
              {section.title}
            </Text>
            <Text style={formChrome.reference} numberOfLines={1}>
              {section.subtitle}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <StarIcon size={17} color="#F5A623" />
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreMax}>/{questionCount}</Text>
          </View>
        </View>
      </SafeAreaView>

      {section.groups.length > 1 ? (
        <ScrollableTabs
          tabs={tabs}
          activeKey={activeGroup}
          onSelect={jumpToGroup}
          style={styles.tabs}
        />
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={formChrome.body}
        contentContainerStyle={formChrome.bodyContent}
        keyboardShouldPersistTaps="handled">
        {section.groups.map(group => (
          <View
            key={group.key}
            style={formChrome.section}
            onLayout={e => {
              groupOffsets.current[group.key] = e.nativeEvent.layout.y;
            }}>
            <Text style={formChrome.sectionTitle}>{group.title}</Text>

            {group.requiresTime ? (
              <>
                <Text style={styles.subLabel}>Time observed</Text>
                <DateTimeField
                  label="Start date & time"
                  required
                  value={values.observed[group.key]?.from ?? ''}
                  onChange={iso => handleObserved(group.key, 'from', iso)}
                />
                <DateTimeField
                  label="End date & time"
                  required
                  value={values.observed[group.key]?.to ?? ''}
                  onChange={iso => handleObserved(group.key, 'to', iso)}
                />
              </>
            ) : null}

            {group.requiresHow ? (
              <View style={formChrome.field}>
                <FieldLabel label="How observed" required />
                <TextField
                  placeholder="Add notes"
                  value={values.howObserved[group.key] ?? ''}
                  onChangeText={next =>
                    onChange(current => ({
                      ...current,
                      howObserved: {...current.howObserved, [group.key]: next},
                    }))
                  }
                  multiline
                  numberOfLines={3}
                  style={formChrome.textarea}
                />
              </View>
            ) : null}

            {group.questions.map(question => {
              questionIndex++;
              return (
                <QuestionBlock
                  key={question.key}
                  index={questionIndex}
                  question={question}
                  answer={values.answers[question.key] ?? ''}
                  note={values.notes[question.key] ?? ''}
                  images={values.images[question.key] ?? []}
                  onAnswer={handleAnswer}
                  onNote={handleNote}
                  onImages={handleImages}
                />
              );
            })}

            {group.notesLabel ? (
              <View style={formChrome.lastField}>
                <FieldLabel label={group.notesLabel} />
                <TextField
                  placeholder="Add notes"
                  value={values.groupNotes[group.key] ?? ''}
                  onChangeText={next =>
                    onChange(current => ({
                      ...current,
                      groupNotes: {...current.groupNotes, [group.key]: next},
                    }))
                  }
                  multiline
                  numberOfLines={4}
                  style={formChrome.textarea}
                />
              </View>
            ) : null}
          </View>
        ))}

        {section.textPrompts.map((prompt, index) => (
          <View key={prompt} style={formChrome.section}>
            <Text style={formChrome.sectionTitle}>{prompt}</Text>
            <View style={formChrome.lastField}>
              <TextField
                placeholder="Add notes"
                value={values.texts[index] ?? ''}
                onChangeText={next =>
                  onChange(current => ({
                    ...current,
                    texts: {...current.texts, [index]: next},
                  }))
                }
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.progress}>
            {answeredCount} of {questionCount} answered
          </Text>
          <TouchableOpacity
            style={styles.save}
            activeOpacity={0.9}
            onPress={onSave}>
            <Text style={formChrome.submitText}>
              {values.saved ? 'Update Section' : 'Save Section'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
  scoreValue: {
    fontFamily: theme.fonts.black,
    fontSize: 17,
    color: '#1A1C1E',
  },
  scoreMax: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  tabs: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  footerRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  progress: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  save: {
    height: 52,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
});

export default SectionEditor;
