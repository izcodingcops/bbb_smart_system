import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {RecordCardSkeleton, SectionTitle} from '../../../components/ui';
import WorkCard from './WorkCard';
import {WorkBucket, WorkItem} from '../../../types/work';
import {theme} from '../../../theme';

const SKELETON_CARDS = [0, 1];
/** Home is a preview — the full list lives on the Work tab via "View All". */
const MAX_VISIBLE = 5;

interface Props {
  items: WorkItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

const RecentWork: React.FC<Props> = ({items, isLoading, onViewAll}) => {
  const [tab, setTab] = useState<WorkBucket>('assigned');

  const assignedCount = items.filter(w => w.bucket === 'assigned').length;
  const completedCount = items.filter(w => w.bucket === 'completed').length;
  const visible = items.filter(w => w.bucket === tab).slice(0, MAX_VISIBLE);

  const renderTab = (bucket: WorkBucket, label: string, count: number) => {
    const active = tab === bucket;
    return (
      <TouchableOpacity
        style={[styles.tab, active && styles.tabActive]}
        activeOpacity={0.8}
        onPress={() => setTab(bucket)}>
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {label}
        </Text>
        <View style={[styles.count, active && styles.countActive]}>
          <Text style={[styles.countText, active && styles.countTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SectionTitle
        title="Recent Work"
        style={styles.title}
        action={
          <TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        }
      />

      {/* Held back while loading, otherwise it flashes "Assigned Work 0". */}
      {isLoading ? null : (
        <View style={styles.tabs}>
          {renderTab('assigned', 'Assigned Work', assignedCount)}
          {renderTab('completed', 'Completed Work', completedCount)}
        </View>
      )}

      {isLoading
        ? SKELETON_CARDS.map(index => (
            <RecordCardSkeleton key={index} fieldCount={3} style={styles.cardSpacing} />
          ))
        : visible.map(item => <WorkCard key={item.id} item={item} />)}
    </>
  );
};

const styles = StyleSheet.create({
  title: {marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md},
  viewAll: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
  },
  // Matches WorkCard's own marginBottom, so trailing space before the next
  // section is identical in the loading and loaded states.
  cardSpacing: {marginBottom: theme.spacing.md},
  tabActive: {backgroundColor: '#E6F4FF'},
  tabText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {color: theme.colors.primary, fontFamily: theme.fonts.black},
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF1F4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countActive: {backgroundColor: theme.colors.primary},
  countText: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  countTextActive: {color: theme.colors.white},
});

export default RecentWork;
