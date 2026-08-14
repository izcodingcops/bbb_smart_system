import React, {useCallback, useState} from 'react';
import {Alert, ScrollView, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import {
  ConfirmDialog,
  DateTimeField,
  DetailTopBar,
  EmptyState,
  FieldLabel,
  FormScreenSkeleton,
  PrimaryButton,
  TextField,
  UploadField,
  formChrome,
} from '../../components/ui';
import {BoxIcon, XIcon} from '../../components/icons';
import {
  useCheckOutEquipmentMutation,
  useEquipmentFormOptionsQuery,
  useGetEquipmentDetailQuery,
} from '../../graphql/features/equipment/hooks';
import EquipmentSummaryCard from './components/EquipmentSummaryCard';
import AbnormalityBlock from './components/AbnormalityBlock';
import {theme} from '../../theme';

interface Props {
  id: string;
  onClose: () => void;
  onDone: (reference: string, queued: boolean) => void;
}

const CheckOutEquipmentScreen: React.FC<Props> = ({id, onClose, onDone}) => {
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
  const {mutate: checkOut, isLoading: isSubmitting} = useCheckOutEquipmentMutation();

  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString());
  const [hasAbnormality, setHasAbnormality] = useState<boolean>(false);
  const [abnormality, setAbnormality] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  // Set the first time the user changes any field — an untouched form can
  // close directly, a touched one confirms the discard first.
  const [touched, setTouched] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const handleClose = useCallback(() => {
    if (touched) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [touched, onClose]);

  const handleDateChange = (iso: string) => {
    setOccurredAt(iso);
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
        title="Add Check-Out"
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
        <DetailTopBar title="Add Check-Out" onBack={onClose} />
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

  const canSubmit = !isSubmitting && !(hasAbnormality && !abnormality);

  const runSubmit = async () => {
    setConfirmSubmit(false);
    try {
      const result = await checkOut(id, {
        occurredAt,
        hasAbnormality,
        abnormality,
        description,
        images,
      });
      onDone(result.reference, result.queued);
    } catch {
      Alert.alert(
        "Couldn't check out equipment",
        'Something went wrong. Check your connection and try again.',
      );
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
            <Text style={formChrome.title}>Add Check-Out</Text>
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
            <EquipmentSummaryCard equipment={detail} />
          </View>

          <View style={formChrome.section}>
            <Text style={formChrome.sectionTitle}>Checkout Details</Text>

            <DateTimeField
              label="Date & Time of Activity"
              required
              value={occurredAt}
              onChange={handleDateChange}
            />

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
        <PrimaryButton
          label="Check-Out Equipment"
          onPress={() => setConfirmSubmit(true)}
          disabled={!canSubmit}
        />
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        title="Confirm check-out"
        message={
          <Text>
            Check out{' '}
            <Text style={styles.bold}>
              {detail.equipmentType} {detail.reference}
            </Text>{' '}
            to you? It will appear in your Checked-Out tab.
          </Text>
        }
        confirmLabel="Check-Out"
        onConfirm={runSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        title="Discard checkout details?"
        message="You have unsaved details. If you leave now, everything you entered will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
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

export default CheckOutEquipmentScreen;
