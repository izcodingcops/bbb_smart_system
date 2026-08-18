import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  DetailField,
  DetailSection,
  formatDateTime,
} from '../../../components/ui';
import {RvpAnsweredSection} from '../../../types/rvpSiteVisit';
import QuestionRow from './QuestionRow';
import {theme} from '../../../theme';

/**
 * The section pill is tinted by **ratio**, deliberately not by `ScorePill`'s
 * absolute 0-5 tiers — the handoff's `rvv-score` grades a section against its
 * own question count, which varies from 3 to 18.
 */
function ratioStyle(score: number, scoreMax: number) {
  const ratio = scoreMax === 0 ? 0 : score / scoreMax;
  if (ratio >= 0.8) {
    return {bg: '#F6FFED', fg: '#389E0D'};
  }
  if (ratio >= 0.5) {
    return {bg: '#FFFBE6', fg: '#AD8B00'};
  }
  return {bg: '#FFF2F0', fg: '#CF1322'};
}

interface Props {
  section: RvpAnsweredSection;
}

const SectionTab: React.FC<Props> = ({section}) => {
  const tone = ratioStyle(section.score, section.scoreMax);
  // A single-group section's title would just repeat the section heading.
  const showGroupTitles = section.groups.length > 1;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{section.title}</Text>
        <View style={[styles.scorePill, {backgroundColor: tone.bg}]}>
          <Text style={[styles.scoreText, {color: tone.fg}]}>
            {section.score}/{section.scoreMax}
          </Text>
        </View>
      </View>

      {section.groups.map(group => (
        <View key={group.title} style={styles.group}>
          {showGroupTitles ? (
            <Text style={styles.groupTitle}>{group.title}</Text>
          ) : null}

          {group.observedFrom ? (
            <View style={styles.grid}>
              <DetailField
                label="Start date & time"
                value={formatDateTime(group.observedFrom)}
              />
              <DetailField
                label="End date & time"
                value={formatDateTime(group.observedTo)}
              />
            </View>
          ) : null}

          {group.howObserved ? (
            <View style={styles.stacked}>
              <DetailField label="How observed" value={group.howObserved} full />
            </View>
          ) : null}

          {group.answers.map(answer => (
            <QuestionRow key={answer.question} answer={answer} />
          ))}

          {group.notes ? (
            <View style={styles.stacked}>
              <DetailField label={group.notesLabel} value={group.notes} full />
            </View>
          ) : null}
        </View>
      ))}

      {section.texts.length > 0 ? (
        <DetailSection title="Notes" grid={false}>
          {section.texts.map(text => (
            <View key={text.label} style={styles.text}>
              <DetailField label={text.label} value={text.value || '—'} full />
            </View>
          ))}
        </DetailSection>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 18,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontFamily: theme.fonts.black,
    fontSize: 19,
    letterSpacing: -0.4,
    color: theme.colors.text,
  },
  scorePill: {
    height: 24,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {fontFamily: theme.fonts.black, fontSize: 12.5},
  group: {paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.lg},
  groupTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: '#313335',
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    columnGap: 14,
    marginBottom: theme.spacing.md,
  },
  stacked: {marginBottom: theme.spacing.md},
  text: {marginBottom: theme.spacing.md},
});

export default SectionTab;
