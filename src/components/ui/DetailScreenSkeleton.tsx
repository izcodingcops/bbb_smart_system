import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import DetailTopBar from './DetailTopBar';
import Skeleton from './Skeleton';
import {theme} from '../../theme';

type FieldWidth = 'half' | 'full';

interface Props {
  /** Screen title — already known before the record loads, so it's shown for real rather than as a bone. */
  title: string;
  onBack: () => void;
  /** Field widths per section, in the order DetailSections appear on screen. */
  sections: FieldWidth[][];
  /** Maintenance's detail screen has an "Add comment" button beside the id; Fixture's doesn't. */
  showCommentButton?: boolean;
}

/**
 * Loading placeholder shaped like ViewMaintenanceScreen/ViewFixtureScreen —
 * the real DetailTopBar (its title and back button don't depend on the record
 * that's loading), the id row, and DetailSection-shaped cards holding generic
 * label+value pairs.
 */
const DetailScreenSkeleton: React.FC<Props> = ({
  title,
  onBack,
  sections,
  showCommentButton,
}) => (
  <View style={styles.root}>
    <DetailTopBar title={title} onBack={onBack} />

    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <View style={styles.idRow}>
        <Skeleton width={140} height={25} />
        {showCommentButton ? (
          <Skeleton width={130} height={40} radius={theme.radius.md} />
        ) : null}
      </View>

      {sections.map((fields, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Skeleton width={150} height={17.5} style={styles.sectionTitle} />
          <View style={styles.grid}>
            {fields.map((width, fieldIndex) => (
              <View
                key={fieldIndex}
                style={width === 'full' ? styles.fieldFull : styles.field}>
                <Skeleton width={70} height={12.5} />
                <Skeleton width="80%" height={15} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  body: {paddingBottom: 40},
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 18,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  sectionTitle: {marginBottom: theme.spacing.lg},
  grid: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 14},
  field: {width: '47%', gap: 6},
  fieldFull: {width: '100%', gap: 6},
});

export default DetailScreenSkeleton;
