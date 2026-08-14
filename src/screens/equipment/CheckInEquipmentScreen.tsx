import React, {useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import {
  ConfirmDialog,
  DateTimeField,
  DetailTopBar,
  EmptyState,
  FieldLabel,
  FormScreenSkeleton,
  TextField,
  Toast,
  UploadField,
  formChrome,
} from '../../components/ui';
import {BoxIcon, XIcon} from '../../components/icons';
import {useFormDiscardState} from '../../hooks/useFormDiscardState';
import {
  useCheckInEquipmentMutation,
  useEquipmentFormOptionsQuery,
  useGetEquipmentDetailQuery,
} from '../../graphql/features/equipment/hooks';
import EquipmentSummaryCard from './components/EquipmentSummaryCard';
import AbnormalityBlock from './components/AbnormalityBlock';
import {theme} from '../../theme';

interface Props {
  id: string;
  onClose: () => void;
  /**
   * `equipmentType` comes from this screen's own `detail` (loaded before
   * submission) since the check-in mutation's result only carries id and
   * reference — the caller needs it to build the success toast's copy.
   */
  onDone: (equipmentType: string, reference: string, queued: boolean) => void;
}

const CheckInEquipmentScreen: React.FC<Props> = ({id, onClose, onDone}) => {
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
  const {mutate: checkIn, isLoading: isSubmitting} = useCheckInEquipmentMutation();

  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString());
  const [currentUsage, setCurrentUsage] = useState('');
  const [hasAbnormality, setHasAbnormality] = useState<boolean | null>(null);
  const [abnormality, setAbnormality] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const {
    setTouched,
    confirmSubmit,
    setConfirmSubmit,
    confirmDiscard,
    setConfirmDiscard,
    submitFailed,
    setSubmitFailed,
    handleClose,
    confirmDiscardAndClose,
  } = useFormDiscardState(onClose);

  const handleDateChange = (iso: string) => {
    setOccurredAt(iso);
    setTouched(true);
  };

  const handleUsageChange = (value: string) => {
    setCurrentUsage(value);
    setTouched(true);
  };

  // AbnormalityBlock is presentational and never clears `abnormality` itself
  // on "No" — this form owns that so a prior "Yes" selection can't sneak a
  // stale abnormality through on submit.
  const handleAbnormalityValue = (value: boolean) => {
    setHasAbnormality(value);
    if (!value) {
      setAbnormality(null);
    }
    setTouched(true);
  };

  const handleAbnormalityChoice = (value: string) => {
    setAbnormality(value);
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
        title="Check-in"
        onClose={onClose}
        sectionRowCounts={[4]}
      />
    );
  }

  // The close affordance renders above this branch on purpose — the tab bar
  // is hidden on this route, so a failed load with no way out would trap the
  // user. There is no BackHandler anywhere in this app.
  if (isError || !detail || !options) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Check-in" onBack={onClose} />
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
    currentUsage.trim().length > 0 &&
    hasAbnormality !== null &&
    !(hasAbnormality && !abnormality);

  const runSubmit = async () => {
    setConfirmSubmit(false);
    try {
      const result = await checkIn(id, {
        occurredAt,
        currentUsage,
        hasAbnormality: hasAbnormality === true,
        abnormality,
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
            <Text style={formChrome.title}>Check-in</Text>
            <Text style={formChrome.reference}>{detail.serial}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={formChrome.bodyWrap}>
        <ScrollView
          style={formChrome.body}
          contentContainerStyle={formChrome.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.summaryWrap}>
            <EquipmentSummaryCard equipment={detail} showCheckedOut />
          </View>

          <View style={formChrome.section}>
            <Text style={formChrome.sectionTitle}>Check-in Details</Text>

            <DateTimeField
              label="Date & Time of Activity"
              required
              value={occurredAt}
              onChange={handleDateChange}
            />

            <View style={formChrome.field}>
              <FieldLabel
                label="What is the current usage (i.e. hours, miles) on this equipment?"
                required
              />
              <TextField
                placeholder="Current usage"
                value={currentUsage}
                onChangeText={handleUsageChange}
              />
            </View>

            <AbnormalityBlock
              value={hasAbnormality}
              abnormality={abnormality}
              options={options.abnormalities}
              onChangeValue={handleAbnormalityValue}
              onChangeAbnormality={handleAbnormalityChoice}
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
      </View>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>Check-In Equipment</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        title="Check in this equipment?"
        message={
          <Text>
            <Text style={styles.bold}>
              {detail.name} {detail.reference}
            </Text>{' '}
            will be checked in and removed from your equipment list. Please
            return the physical equipment to its designated location.
          </Text>
        }
        confirmLabel="Check In"
        onConfirm={runSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        title="Discard check-in details?"
        message="You have unsaved details. If you leave now, everything you entered will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={confirmDiscardAndClose}
        onCancel={() => setConfirmDiscard(false)}
      />

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong checking in this equipment. Check your connection and try again."
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

export default CheckInEquipmentScreen;
