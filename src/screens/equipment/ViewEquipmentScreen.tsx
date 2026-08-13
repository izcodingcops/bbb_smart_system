import React, {useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  StatusPill,
  detailGrid,
  formatDateTimeOrNull,
} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {useGetEquipmentDetailQuery} from '../../graphql/features/equipment/hooks';
import {EquipmentStatus} from '../../types/equipment';
import EquipmentDetailTabs from './components/EquipmentDetailTabs';
import UpkeepList from './components/UpkeepList';
import {theme} from '../../theme';

const STATUS_STYLE: Record<EquipmentStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  'Checked-Out': {bg: '#E6F4FF', fg: '#0066B2'},
};

const DETAIL_TABS = [
  {key: 'equipment', label: 'Equipment Details'},
  {key: 'upkeep', label: 'Upkeep Details'},
];

interface Props {
  id: string;
  onClose: () => void;
  onCheckOut: (id: string) => void;
  onCheckIn: (id: string) => void;
  onAddUpkeep: (id: string) => void;
}

const ViewEquipmentScreen: React.FC<Props> = ({
  id,
  onClose,
  onCheckOut,
  onCheckIn,
  onAddUpkeep,
}) => {
  // Every hook runs before the early returns below — the loading, error and
  // loaded branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetEquipmentDetailQuery(id);
  const [tab, setTab] = useState('equipment');

  if (isLoading) {
    return (
      <DetailScreenSkeleton
        title="Equipment"
        onBack={onClose}
        sections={[
          ['half', 'half', 'half', 'half', 'half', 'half', 'full'],
          ['half', 'half'],
          ['half', 'half', 'half'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the
  // user. There is no BackHandler anywhere in this app.
  if (isError || !detail) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Equipment" onBack={onClose} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<BoxIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this equipment"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </ScreenBackground>
    );
  }

  const status = STATUS_STYLE[detail.status];

  const basicDetails = (
    <DetailSection title="Basic Details">
      <View style={detailGrid}>
        <DetailField label="Type of Equipment" value={detail.equipmentType} />
        <DetailField label="Name" value={detail.name} />
        <DetailField label="Model" value={detail.model} />
        <DetailField label="Make" value={detail.make} />
        <DetailField
          label="Date Acquired"
          value={formatDateTimeOrNull(detail.acquiredAt)}
        />
        <DetailField label="Category" value={detail.category} />
        <DetailField label="Usage Type" value={detail.unit} />
        <DetailField label="Serial / Vehicle No." value={detail.serial} />
        <DetailField label="Beg. Miles/Hours" value={detail.beginningUsage} />
        <DetailField label="Year" value={detail.year} />
        <DetailField label="Zone" value={detail.zone} />
        <DetailField label="Status">
          <StatusPill label={detail.status} bg={status.bg} fg={status.fg} size="md" />
        </DetailField>
        <DetailField label="Ownership Status" value={detail.ownership} />
        <DetailField label="Description" value={detail.description} full />
      </View>
    </DetailSection>
  );

  const checkoutActivity = (
    <DetailSection title="Checkout Activity">
      <View style={detailGrid}>
        <DetailField
          label="User Checkout"
          value={detail.mine ? 'Me' : detail.checkedOutBy}
        />
        <DetailField
          label="Last Checkout"
          value={formatDateTimeOrNull(detail.checkedOutAt)}
        />
      </View>
    </DetailSection>
  );

  const connectedAssets = (
    <DetailSection title="Connected Assets">
      <View style={detailGrid}>
        <DetailField
          label="Incidents"
          value={detail.incidents.length ? detail.incidents.join(', ') : null}
        />
        <DetailField
          label="Persons of Interest"
          value={
            detail.personsOfInterest.length
              ? detail.personsOfInterest.join(', ')
              : null
          }
        />
        <DetailField
          label="Maintenance"
          value={detail.maintenance.length ? detail.maintenance.join(', ') : null}
        />
      </View>
    </DetailSection>
  );

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar title="Equipment" reference={detail.serial} onBack={onClose} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.reference}</Text>
          <View style={styles.idActions}>
            {detail.mine ? (
              <>
                <TouchableOpacity
                  style={[styles.idAction, styles.idActionGhost]}
                  activeOpacity={0.85}
                  onPress={() => onAddUpkeep(detail.id)}>
                  <Text style={styles.idActionGhostText}>Add Upkeep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.idAction, styles.idActionSolid]}
                  activeOpacity={0.85}
                  onPress={() => onCheckIn(detail.id)}>
                  <Text style={styles.idActionSolidText}>Check-In</Text>
                </TouchableOpacity>
              </>
            ) : detail.status === 'Active' ? (
              <TouchableOpacity
                style={[styles.idAction, styles.idActionSolid]}
                activeOpacity={0.85}
                onPress={() => onCheckOut(detail.id)}>
                <Text style={styles.idActionSolidText}>Check-Out Equipment</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {detail.mine ? (
          <>
            <View style={styles.tabsWrap}>
              <EquipmentDetailTabs
                tabs={DETAIL_TABS}
                activeKey={tab}
                onSelect={setTab}
              />
            </View>
            {tab === 'upkeep' ? (
              <UpkeepList upkeeps={detail.upkeeps} />
            ) : (
              <>
                {basicDetails}
                {checkoutActivity}
                {connectedAssets}
              </>
            )}
          </>
        ) : (
          <>
            {basicDetails}
            {connectedAssets}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  errorWrap: {flex: 1, justifyContent: 'center'},
  body: {paddingBottom: theme.spacing.xxl},
  idRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  idBig: {
    fontFamily: theme.fonts.black,
    fontSize: 24,
    letterSpacing: -0.4,
    color: theme.colors.textOnGlass,
  },
  idActions: {flexDirection: 'row', gap: theme.spacing.sm},
  idAction: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  idActionGhost: {
    borderWidth: 1.5,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.glass.buttonFill,
  },
  idActionGhostText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
  idActionSolid: {backgroundColor: theme.colors.primary},
  idActionSolidText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.white,
  },
  tabsWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
});

export default ViewEquipmentScreen;
