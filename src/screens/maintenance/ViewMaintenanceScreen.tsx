import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {formatDateTime} from '../../components/ui';
import {
  ChevronLeftIcon,
  EditIcon,
  FileTextIcon,
  MessageSquareIcon,
  TrashIcon,
} from '../../components/icons';
import {useGetMaintenanceRequestQuery} from '../../graphql/features/maintenance/hooks';
import {MaintenanceStatus} from '../../types/maintenance';
import {theme} from '../../theme';

const STATUS_STYLE: Record<MaintenanceStatus, {bg: string; fg: string}> = {
  Open: {bg: '#F1F3F5', fg: '#475467'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

interface FieldProps {
  label: string;
  value?: string | null;
  /** Spans both grid columns. */
  full?: boolean;
  children?: React.ReactNode;
}

/** Label above value in a grid cell. Falls back to a muted "N/A". */
export const DetailField: React.FC<FieldProps> = ({
  label,
  value,
  full = false,
  children,
}) => (
  <View style={[styles.field, full && styles.fieldFull]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children ?? (
      <Text style={[styles.fieldValue, !value && styles.fieldValueEmpty]}>
        {value || 'N/A'}
      </Text>
    )}
  </View>
);

interface Props {
  id: string;
  onClose: () => void;
}

const ViewMaintenanceScreen: React.FC<Props> = ({id, onClose}) => {
  const {data: detail, isLoading} = useGetMaintenanceRequestQuery(id);

  if (isLoading || !detail) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topbar}>
        <View style={styles.topbarRow}>
          <TouchableOpacity
            style={styles.topbarButton}
            activeOpacity={0.8}
            onPress={onClose}>
            <ChevronLeftIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={styles.topbarText}>
            <Text style={styles.topbarTitle}>Maintenance</Text>
            <Text style={styles.topbarReference}>{detail.id}</Text>
          </View>
          <View style={styles.topbarActions}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() => {}}>
              <EditIcon size={16} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.85}
              onPress={() => {}}>
              <TrashIcon size={18} color="#CF1322" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.id}</Text>
          <TouchableOpacity
            style={styles.commentButton}
            activeOpacity={0.85}
            onPress={() => {}}>
            <MessageSquareIcon size={17} />
            <Text style={styles.commentButtonText}>Add comment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <View style={styles.grid}>
            <DetailField label="Ambassador" value={detail.ambassador} />
            <DetailField label="Type" value={detail.type} />
            <DetailField label="Program Name">
              <Text style={styles.fieldValue}>
                {detail.programName}
                {'\n'}
                {detail.programCode}
              </Text>
            </DetailField>
            <DetailField label="Priority" value={detail.priority} />
            <DetailField label="Business Name" value={detail.businessName} />
            <DetailField label="Status">
              <View style={[styles.pill, {backgroundColor: status.bg}]}>
                <Text style={[styles.pillText, {color: status.fg}]}>
                  {detail.status}
                </Text>
              </View>
            </DetailField>
            <DetailField label="Created By" value={detail.createdBy} />
            <DetailField label="Completed By" value={detail.completedBy} />
            <DetailField
              label="Completed On"
              value={
                detail.completedOn ? formatDateTime(detail.completedOn) : null
              }
            />
            <DetailField
              label="Request Date & Time"
              value={formatDateTime(detail.requestedAt)}
            />
            <DetailField label="Payment Status" full>
              <View style={styles.payRow}>
                <FileTextIcon size={17} color={theme.colors.textSecondary} />
                <Text style={styles.fieldValue}>
                  {detail.paid ? 'Paid' : 'Un-Paid'}
                </Text>
              </View>
            </DetailField>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Details</Text>
          <View style={styles.grid}>
            <DetailField label="Description" value={detail.description} full />
            <DetailField label="Document" full>
              {detail.documents.length > 0 ? (
                <View style={styles.thumbs}>
                  {detail.documents.map(uri => (
                    <Image key={uri} source={{uri}} style={styles.thumb} />
                  ))}
                </View>
              ) : (
                <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>
                  N/A
                </Text>
              )}
            </DetailField>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.grid}>
            <DetailField label="Address" value={detail.address} full />
            <DetailField label="Zone" value={detail.zone} />
            <DetailField
              label="Describe Location"
              value={detail.describeLocation}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Elements</Text>
          <View style={styles.grid}>
            <DetailField label="Fixture" value={detail.fixture} />
            <DetailField
              label="Incident"
              value={detail.incidents.join(', ') || null}
            />
            <DetailField
              label="Person of Interest"
              value={detail.pois.join(', ') || null}
            />
            <DetailField
              label="Equipment"
              value={detail.equipment.join(', ') || null}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  topbar: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  topbarButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F4',
  },
  topbarText: {flex: 1, minWidth: 0, paddingTop: 2},
  topbarTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  topbarReference: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  topbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  editText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCCC7',
    backgroundColor: '#FFF2F0',
  },
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
  idBig: {
    flex: 1,
    fontFamily: theme.fonts.black,
    fontSize: 25,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  commentButtonText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 17.5,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 14},
  field: {width: '47%'},
  fieldFull: {width: '100%'},
  fieldLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: '#5B7290',
    marginBottom: 6,
  },
  fieldValue: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
  },
  fieldValueEmpty: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: {fontFamily: theme.fonts.black, fontSize: 12.5},
  payRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm},
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 2},
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
});

export default ViewMaintenanceScreen;
