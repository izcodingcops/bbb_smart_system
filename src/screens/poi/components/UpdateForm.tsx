import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  TextField,
  Toast,
} from '../../../components/ui';
import {ChevronLeftIcon, XIcon} from '../../../components/icons';
import {
  PoiUpdateFormOptions,
  PoiUpdateFormValues,
} from '../../../types/poi';
import {
  LockedPersonField,
  personIdForName,
  personNameForId,
} from './InteractionForm';

export function buildUpdateValues(
  options: PoiUpdateFormOptions,
  personId?: string,
): PoiUpdateFormValues {
  return {
    personId: personId ?? '',
    occurredAt: new Date().toISOString(),
    zone: options.zones[0] ?? '',
    description: '',
  };
}

interface Props {
  /** Display reference shown under the title, e.g. '#UPD-3301'. */
  reference: string;
  options: PoiUpdateFormOptions;
  initialValues: PoiUpdateFormValues;
  lockedPersonName?: string;
  isSubmitting: boolean;
  onSubmit: (values: PoiUpdateFormValues) => Promise<void>;
  onClose: () => void;
}

/**
 * One section, no accordions and no SectionTabs — the design gives Add Update
 * none, and four fields don't need jump navigation.
 */
const UpdateForm: React.FC<Props> = ({
  reference,
  options,
  initialValues,
  lockedPersonName,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<PoiUpdateFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);

  const set = <K extends keyof PoiUpdateFormValues>(
    key: K,
    value: PoiUpdateFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  const canSubmit =
    values.personId.length > 0 &&
    values.zone.length > 0 &&
    values.description.trim().length > 0 &&
    !isSubmitting;

  const runSubmit = async () => {
    try {
      await onSubmit(values);
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
            onPress={() => setConfirmDiscard(true)}>
            {lockedPersonName ? (
              <ChevronLeftIcon size={19} color="#3A3F46" />
            ) : (
              <XIcon size={19} color="#3A3F46" />
            )}
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>Add Update</Text>
            <Text style={formChrome.reference}>
              {lockedPersonName
                ? `${reference} · ${lockedPersonName}`
                : reference}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={formChrome.body}
        contentContainerStyle={formChrome.bodyContent}
        keyboardShouldPersistTaps="handled">
        <View style={formChrome.section}>
          <Text style={formChrome.sectionTitle}>Basic Details</Text>

          {lockedPersonName ? (
            <LockedPersonField name={lockedPersonName} />
          ) : (
            <DropdownField
              label="Person"
              required
              placeholder="Search and select a person"
              options={options.people.map(p => p.name)}
              value={personNameForId(options.people, values.personId)}
              onChange={next =>
                set('personId', personIdForName(options.people, next))
              }
              searchable
            />
          )}

          <DateTimeField
            label="Date & Time"
            required
            value={values.occurredAt}
            onChange={next => set('occurredAt', next)}
          />

          <DropdownField
            label="Zone"
            required
            placeholder="Select zone"
            options={options.zones}
            value={values.zone}
            onChange={next => set('zone', next)}
            searchable={false}
          />

          <View style={formChrome.lastField}>
            <FieldLabel label="Description" required />
            <TextField
              placeholder="Describe this update"
              value={values.description}
              onChangeText={next => set('description', next)}
              multiline
              numberOfLines={4}
              style={formChrome.textarea}
            />
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={formChrome.footer}>
        <TouchableOpacity
          style={[formChrome.submit, !canSubmit && formChrome.submitDisabled]}
          activeOpacity={0.9}
          disabled={!canSubmit}
          onPress={() => setConfirmSubmit(true)}>
          <Text style={formChrome.submitText}>Save Update</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit update?"
        message={`${reference} will be created and added to your Work Log. You can edit it later from the details screen.`}
        confirmLabel="Submit"
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        onConfirm={() => {
          setConfirmSubmit(false);
          runSubmit();
        }}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this update?"
        message="You have unsaved details. If you leave now, everything you entered on this form will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong saving this update. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

export default UpdateForm;
