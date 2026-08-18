import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {
  DetailField,
  DetailSection,
  formatCardDateOnly,
  formatDateTime,
  PersonChip,
} from '../../../components/ui';
import {StarIcon} from '../../../components/icons';
import {RvpSiteVisitDetail} from '../../../types/rvpSiteVisit';
import {theme} from '../../../theme';

interface Props {
  visit: RvpSiteVisitDetail;
}

const BasicDetailsTab: React.FC<Props> = ({visit}) => (
  <DetailSection title="Basic Details">
    <DetailField label="Type of Visit" value={visit.visitType} />
    <DetailField label="Reviewed By">
      <PersonChip name={visit.reviewedBy} />
    </DetailField>
    <DetailField label="Start Date" value={formatCardDateOnly(visit.startDate)} />
    <DetailField label="End Date" value={formatCardDateOnly(visit.endDate)} />
    {/* Only Drop In and Special Purpose visits carry one. */}
    {visit.reasonForVisit ? (
      <DetailField label="Reason for Visit" value={visit.reasonForVisit} full />
    ) : null}
    <DetailField label="Program" value={visit.program} />
    <DetailField label="Avg Score">
      <View style={styles.scoreRow}>
        <StarIcon size={13} color="#F5A623" />
        <Text style={styles.scoreText}>
          {visit.score}/{visit.scoreMax}
        </Text>
      </View>
    </DetailField>
    <DetailField label="Updated By">
      <PersonChip name={visit.updatedBy} />
    </DetailField>
    <DetailField label="Updated Date" value={formatDateTime(visit.updatedAt)} />
    <DetailField label="Images" full>
      {visit.images.length > 0 ? (
        <View style={styles.thumbs}>
          {visit.images.map(uri => (
            <Image key={uri} source={{uri}} style={styles.thumb} />
          ))}
        </View>
      ) : undefined}
    </DetailField>
  </DetailSection>
);

const styles = StyleSheet.create({
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  scoreText: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.text,
  },
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  thumb: {width: 64, height: 64, borderRadius: theme.radius.md},
});

export default BasicDetailsTab;
