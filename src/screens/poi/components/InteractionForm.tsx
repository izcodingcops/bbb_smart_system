import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  AccordionSection,
  AccordionSectionHandle,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  SectionTabItem,
  SectionTabs,
  TextField,
  Toast,
  UploadField,
} from '../../../components/ui';
import {ChevronLeftIcon, LockIcon, XIcon} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  PoiInteractionFormOptions,
  PoiInteractionFormValues,
  PoiPerson,
} from '../../../types/poi';
import {theme} from '../../../theme';

/**
 * The person picker shows names but the wire carries ids, so both directions
 * go through one pair of helpers. Names can collide — the id is the key, and
 * the form never stores a name.
 */
export function personIdForName(people: PoiPerson[], name: string): string {
  return people.find(p => p.name === name)?.id ?? '';
}

export function personNameForId(people: PoiPerson[], id: string): string {
  return people.find(p => p.id === id)?.name ?? '';
}

const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'other', label: 'Other Details'},
];

/** A person id is pre-set when opened from a card or the detail screen. */
export function buildInteractionValues(
  options: PoiInteractionFormOptions,
  personId?: string,
): PoiInteractionFormValues {
  return {
    personId: personId ?? '',
    interactionType: '',
    occurredAt: new Date().toISOString(),
    zone: options.zones[0] ?? '',
    fixture: '',
    businessLocation: '',
    violation: '',
    note: '',
    documents: [],
  };
}

/** Shared by both sub-record forms — the locked, read-only person field. */
export const LockedPersonField: React.FC<{name: string}> = ({name}) => (
  <View style={formChrome.field}>
    <FieldLabel label="Person" required />
    <TextField
      value={name}
      editable={false}
      trailingIcon={<LockIcon size={17} color={theme.colors.textMuted} />}
      containerStyle={lockedStyles.locked}
    />
  </View>
);

const lockedStyles = StyleSheet.create({
  locked: {opacity: 0.75},
});

interface Props {
  /** Display reference shown under the title, e.g. '#INT-9007'. */
  reference: string;
  options: PoiInteractionFormOptions;
  initialValues: PoiInteractionFormValues;
  /** Set when the person was chosen before the form opened. */
  lockedPersonName?: string;
  isSubmitting: boolean;
  onSubmit: (values: PoiInteractionFormValues) => Promise<void>;
  onClose: () => void;
}

const InteractionForm: React.FC<Props> = ({
  reference,
  options,
  initialValues,
  lockedPersonName,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<PoiInteractionFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);

  const otherRef = useRef<AccordionSectionHandle>(null);
  const {
    scrollRef,
    activeTab,
    tabsVisible,
    recordSectionY,
    handleScroll,
    handleScrollBeginDrag,
    handleMomentumScrollEnd,
    handleTabSelect,
  } = useSectionScrollTabs({
    sectionKeys: SECTION_TABS.map(tab => tab.key),
    onSelect: key => {
      if (key === 'other') {
        otherRef.current?.open();
      }
    },
  });

  const set = <K extends keyof PoiInteractionFormValues>(
    key: K,
    value: PoiInteractionFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  const canSubmit =
    values.personId.length > 0 &&
    values.interactionType.length > 0 &&
    values.zone.length > 0 &&
    !isSubmitting;

  // The design titles this 'Add Interaction' when it already knows the person,
  // and 'Create Interaction' when the form has to ask.
  const title = lockedPersonName ? 'Add Interaction' : 'Create Interaction';

  const runSubmit = async () => {
    try {
      await onSubmit(values);
    } catch {
      setSubmitFailed(true);
    }
  };

  return (
    <View style={formChrome.root}>
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
            <Text style={formChrome.title}>{title}</Text>
            <Text style={formChrome.reference}>
              {lockedPersonName
                ? `${reference} · ${lockedPersonName}`
                : reference}
            </Text>
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
          scrollEventThrottle={16}>
          {/* ---- Basic Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('basic')}>
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

            <DropdownField
              label="Interaction Type"
              required
              placeholder="Select interaction type"
              options={options.interactionTypes}
              value={values.interactionType}
              onChange={next => set('interactionType', next)}
              searchable
            />

            <DateTimeField
              label="Date & Time"
              required
              value={values.occurredAt}
              onChange={next => set('occurredAt', next)}
            />

            {/*
              The design renders this as a read-only 'Auto' box. It's a picker
              here, matching the shipped app and the Add Update form — an
              interaction's zone is a field the Ambassador corrects, not a
              reading.
            */}
            <View style={formChrome.lastField}>
              <DropdownField
                label="Zone"
                required
                placeholder="Select zone"
                options={options.zones}
                value={values.zone}
                onChange={next => set('zone', next)}
                searchable={false}
              />
            </View>
          </View>

          {/* ---- Other Details ---- */}
          <AccordionSection
            ref={otherRef}
            title="Other Details"
            initiallyOpen
            onLayout={recordSectionY('other')}>
            <DropdownField
              label="Fixture"
              placeholder="Search and select a fixture"
              options={options.fixtures}
              value={values.fixture}
              onChange={next => set('fixture', next)}
              searchable
            />

            <DropdownField
              label="Business Location"
              placeholder="Search and select a business"
              options={options.businessLocations}
              value={values.businessLocation}
              onChange={next => set('businessLocation', next)}
              searchable
            />

            {/*
              No ordinance-violation Yes/No gate: the design drops it, and an
              empty Violation carries the same information in one field.
            */}
            <DropdownField
              label="Violation"
              placeholder="Search and select a violation"
              options={options.violations}
              value={values.violation}
              onChange={next => set('violation', next)}
              searchable
            />

            <View style={formChrome.field}>
              <FieldLabel label="Interaction Note" />
              <TextField
                placeholder="What happened during this interaction?"
                value={values.note}
                onChangeText={next => set('note', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>

            <UploadField
              label="Upload Image"
              uris={values.documents}
              onChange={next => set('documents', next)}
            />
          </AccordionSection>
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
          <Text style={formChrome.submitText}>Save Interaction</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit interaction?"
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
        title="Discard this interaction?"
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
        message="Something went wrong saving this interaction. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </View>
  );
};

export default InteractionForm;
