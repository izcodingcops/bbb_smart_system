import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {RecordCardSkeleton, SectionTitle} from '../../../components/ui';
import WorkCard from '../../work/components/WorkCard';
import {applyBucket, applyMaintenanceOnly} from '../../work/filtering';
import {GetUserRole} from '../../../redux/auth/selectors';
import {WorkBucket, WorkItem, WorkStatus} from '../../../types/work';
import {theme} from '../../../theme';

const SKELETON_CARDS = [0, 1];
/** Home is a glanceable preview — the full list lives on the Work tab via "View All". */
const MAX_VISIBLE = 2;

interface Props {
  items: WorkItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onOpenItem: (item: WorkItem) => void;
  /** Which card's inline status menu is open, if any — only one at a time. */
  menuItemId: string | null;
  onToggleMenu: (id: string) => void;
  onSelectStatus: (item: WorkItem, status: WorkStatus) => void;
  onOpenAssign: (item: WorkItem) => void;
}

const RecentWork: React.FC<Props> = ({
  items,
  isLoading,
  onViewAll,
  onOpenItem,
  menuItemId,
  onToggleMenu,
  onSelectStatus,
  onOpenAssign,
}) => {
  const role = GetUserRole() ?? 'ambassador';
  const [tab, setTab] = useState<WorkBucket>('assigned');

  const assignedCount = items.filter(w => w.bucket === 'assigned').length;
  const unassignedCount = items.filter(w => w.bucket === 'unassigned').length;
  const completedCount = items.filter(w => w.bucket === 'completed').length;
  const visible = applyMaintenanceOnly(applyBucket(items, tab), tab).slice(
    0,
    MAX_VISIBLE,
  );

  const renderTab = (bucket: WorkBucket, label: string, count: number) => {
    const active = tab === bucket;
    return (
      <TouchableOpacity
        key={bucket}
        style={[styles.tab, active && styles.tabActive]}
        activeOpacity={0.8}
        onPress={() => setTab(bucket)}>
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {label}
        </Text>
        {/* Only the active tab carries a count — matches the reference design. */}
        {active ? (
          <View style={styles.count}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
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

      {/* Held back while loading, otherwise it flashes "Assigned 0". */}
      {isLoading ? null : (
        <View style={styles.tabs}>
          {renderTab('assigned', 'Assigned', assignedCount)}
          {role === 'supervisor'
            ? renderTab('unassigned', 'Un-Assigned', unassignedCount)
            : null}
          {renderTab('completed', 'Completed', completedCount)}
        </View>
      )}

      <View style={styles.cardList}>
        {isLoading
          ? SKELETON_CARDS.map(index => (
              <RecordCardSkeleton key={index} fieldCount={3} />
            ))
          : visible.map(item => (
              <WorkCard
                key={item.id}
                item={item}
                compact
                onPress={onOpenItem}
                menuOpen={menuItemId === item.id}
                onToggleMenu={onToggleMenu}
                onSelectStatus={onSelectStatus}
                onOpenAssign={onOpenAssign}
              />
            ))}
      </View>
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    height: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  cardList: {gap: theme.spacing.md},
  tabActive: {borderColor: theme.colors.primary},
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
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.white,
  },
});

export default RecentWork;
