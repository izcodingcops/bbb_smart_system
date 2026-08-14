import React, {useCallback, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import {
  ConfirmDialog,
  DateTimeField,
  DetailTopBar,
  DropdownField,
  EmptyState,
  FieldLabel,
  FormScreenSkeleton,
  SectionTabItem,
  SectionTabs,
  TextField,
  Toast,
  UploadField,
  formChrome,
} from '../../components/ui';
import {BoxIcon, XIcon} from '../../components/icons';
import {useSectionScrollTabs} from '../../hooks/useSectionScrollTabs';
import {
  useAddEquipmentUpkeepMutation,
  useEquipmentFormOptionsQuery,
  useGetEquipmentDetailQuery,
} from '../../graphql/features/equipment/hooks';
import EquipmentSummaryCard from './components/EquipmentSummaryCard';
import {theme} from '../../theme';

/** Section jump tabs, in the order the sections actually appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic Details'},
  {key: 'other', label: 'Other Details'},
];

interface Props {
  id: string;
  onClose: () => void;
  /**
   * `equipmentType` comes from this screen's own `detail` (loaded before
   * submission) since the mutation's result only carries id and reference —
   * the caller needs it to build the success toast's copy.
   */
  onDone: (equipmentType: string, reference: string, queued: boolean) => void;
}

const AddUpkeepScreen: React.FC<Props> = ({id, onClose, onDone}) => {
  // Every hook runs before the early returns below — loading, error and
  // loaded branches must not change hook order between renders.
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useGetEquipmentDetailQuery(id);
  const {
    data: options,
    isLoading: optionsLoading,
    isError: optionsError,
    refetch: refetchOptions,
  } = useEquipmentFormOptionsQuery();
  const {mutate: addUpkeep, isLoading: isSubmitting} = useAddEquipmentUpkeepMutation();

  const [upkeepType, setUpkeepType] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString());
  const [vendor, setVendor] = useState('');
  const [currentUsage, setCurrentUsage] = useState('');
  const [cost, setCost] = useState('');
  const [zone, setZone] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  // Set the first time the user changes any field — an untouched form can
  // close directly, a touched one confirms the discard first.
  const [touched, setTouched] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /** Set when addUpkeep rejects, so the form can report it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  const {
    scrollRef,
    activeTab,
    tabsVisible,
    recordSectionY,
    handleScroll,
    handleScrollBeginDrag,
    handleMomentumScrollEnd,
    handleTabSelect,
  } = useSectionScrollTabs({sectionKeys: SECTION_TABS.map(tab => tab.key)});

  const handleClose = useCallback(() => {
    if (touched) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [touched, onClose]);

  const handleUpkeepTypeChange = (value: string) => {
    setUpkeepType(value);
    setTouched(true);
  };

  const handleDateChange = (iso: string) => {
    setOccurredAt(iso);
    setTouched(true);
  };

  const handleVendorChange = (value: string) => {
    setVendor(value);
    setTouched(true);
  };

  const handleUsageChange = (value: string) => {
    setCurrentUsage(value);
    setTouched(true);
  };

  const handleCostChange = (value: string) => {
    setCost(value);
    setTouched(true);
  };

  const handleZoneChange = (value: string) => {
    setZone(value);
    setTouched(true);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setTouched(true);
  };

  const handleImagesChange = (value: string[]) => {
    setImages(value);
    setTouched(true);
  };

  const isLoading = detailLoading || optionsLoading;
  const isError =
    detailError ||
    optionsError ||
    (!detailLoading && !detail) ||
    (!optionsLoading && !options);

  const retry = () => {
    refetchDetail();
    refetchOptions();
  };

  if (isLoading) {
    return (
      <FormScreenSkeleton
        title="Upkeep"
        onClose={onClose}
        sectionRowCounts={[5, 3]}
      />
    );
  }

  // The close affordance renders above this branch on purpose — the tab bar
  // is hidden on this route, so a failed load with no way out would trap the
  // user. There is no BackHandler anywhere in this app.
  if (isError || !detail || !options) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Upkeep" onBack={onClose} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<BoxIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this equipment"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={retry}
          />
        </View>
      </ScreenBackground>
    );
  }

  const canSubmit =
    !isSubmitting &&
    upkeepType.trim().length > 0 &&
    vendor.trim().length > 0 &&
    currentUsage.trim().length > 0 &&
    cost.trim().length > 0;

  const runSubmit = async () => {
    setConfirmSubmit(false);
    try {
      const result = await addUpkeep(id, {
        upkeepType,
        occurredAt,
        vendor,
        currentUsage,
        cost,
        zone,
        description,
        images,
      });
      onDone(detail.equipmentType, result.reference, result.queued);
    } catch {
      setSubmitFailed(true);
    }
  };

  return (
    <ScreenBackground style={formChrome.root}>
      <SafeAreaView edges={['top']} style={formChrome.topbar}>
        <View style={formChrome.topbarRow}>
          <TouchableOpacity
            style={formChrome.topbarButton}
            activeOpacity={0.8}
            onPress={handleClose}>
            <XIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>Upkeep</Text>
            <Text style={formChrome.reference}>{detail.serial}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={formChrome.bodyWrap}>
        <ScrollView
          ref={scrollRef}
          style={formChrome.body}
          contentContainerStyle={formChrome.bodyContent}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          <View style={styles.summaryWrap}>
            <EquipmentSummaryCard equipment={detail} showCheckedOut />
          </View>

          {/* ---- Basic Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('basic')}>
            <Text style={formChrome.sectionTitle}>Basic Details</Text>

            <DropdownField
              label="Upkeep Type"
              required
              placeholder="Upkeep Type"
              options={options.upkeepTypes}
              value={upkeepType}
              onChange={handleUpkeepTypeChange}
              searchable
            />

            <DateTimeField
              label="Upkeep Date, Time"
              required
              value={occurredAt}
              onChange={handleDateChange}
            />

            <View style={formChrome.field}>
              <FieldLabel label="Vendor" required />
              <TextField
                placeholder="Vendor"
                value={vendor}
                onChangeText={handleVendorChange}
              />
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Current Miles/Hours" required />
              <TextField
                placeholder="Current Miles/Hours"
                value={currentUsage}
                onChangeText={handleUsageChange}
              />
            </View>

            <View style={formChrome.lastField}>
              <FieldLabel label="Cost" required />
              <TextField
                placeholder="Cost"
                value={cost}
                onChangeText={handleCostChange}
              />
            </View>
          </View>

          {/* ---- Other Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('other')}>
            <Text style={formChrome.sectionTitle}>Other Details</Text>

            <DropdownField
              label="Zone"
              placeholder="Select zone"
              options={options.zones}
              value={zone}
              onChange={handleZoneChange}
              searchable={false}
            />

            <View style={formChrome.field}>
              <FieldLabel label="Description" />
              <TextField
                placeholder="Add a description"
                value={description}
                onChangeText={handleDescriptionChange}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>

            <View style={formChrome.lastField}>
              <UploadField
                label="Image"
                uris={images}
                onChange={handleImagesChange}
                subtitle="PNG or JPG · up to 10 MB"
              />
            </View>
          </View>
        </ScrollView>

        <SectionTabs
          tabs={SECTION_TABS}
          activeKey={activeTab}
          visible={tabsVisible}
          onSelect={handleTabSelect}
        />
      </View>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>Add Upkeep</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        title="Submit upkeep?"
        message={
          <Text>
            Log this upkeep record against{' '}
            <Text style={styles.bold}>
              {detail.equipmentType} {detail.reference}
            </Text>
            .
          </Text>
        }
        confirmLabel="Submit"
        onConfirm={runSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        title="Discard upkeep details?"
        message="You have unsaved details. If you leave now, everything you entered will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong saving this upkeep record. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  errorWrap: {flex: 1, justifyContent: 'center'},
  summaryWrap: {marginHorizontal: theme.spacing.lg, marginTop: 14},
  bold: {fontFamily: theme.fonts.black},
});

export default AddUpkeepScreen;
