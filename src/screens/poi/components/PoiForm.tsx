import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  AccordionSection,
  AccordionSectionHandle,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  formChrome,
  MultiDropdownField,
  SectionTabItem,
  SectionTabs,
  SegmentedButtons,
  TextField,
  Toast,
} from '../../../components/ui';
import {
  CheckIcon,
  ChevronLeftIcon,
  PlusIcon,
  XIcon,
} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {
  PoiDetail,
  PoiDisposition,
  PoiFormOptions,
  PoiFormValues,
} from '../../../types/poi';
import ContactCard, {EMPTY_CONTACT} from './ContactCard';
import {theme} from '../../../theme';

/** Section jump tabs, in the order the sections actually appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'demo', label: 'Demographics'},
  {key: 'contacts', label: 'Contacts'},
  {key: 'connected', label: 'Connected'},
];

/** Create starts from device state; edit starts from the saved record. */
export function buildInitialValues(
  options: PoiFormOptions,
  detail?: PoiDetail,
): PoiFormValues {
  if (detail) {
    return {
      name: detail.name,
      personType: detail.personType,
      disposition: detail.disposition,
      occurredAt: detail.firstSeenAt,
      contact: detail.contact ?? '',
      top1020: detail.top1020,
      alias: detail.alias ?? '',
      gender: detail.gender ?? '',
      age: detail.age ?? '',
      race: detail.race ?? '',
      weight: detail.weight ?? '',
      height: detail.height ?? '',
      physicalDescription: detail.physicalDescription ?? '',
      situation: detail.situation ?? '',
      contacts: detail.contacts.length > 0 ? detail.contacts : [EMPTY_CONTACT],
      connectedIncidents: detail.connectedIncidents,
      connectedMaintenance: detail.connectedMaintenance,
      connectedEquipment: detail.connectedEquipment,
    };
  }
  return {
    name: '',
    personType: '',
    disposition: (options.dispositions[0] as PoiDisposition) ?? 'Active',
    occurredAt: new Date().toISOString(),
    contact: '',
    top1020: false,
    alias: '',
    gender: '',
    age: '',
    race: '',
    weight: '',
    height: '',
    physicalDescription: '',
    situation: '',
    contacts: [EMPTY_CONTACT],
    connectedIncidents: [],
    connectedMaintenance: [],
    connectedEquipment: [],
  };
}

interface Props {
  mode: 'create' | 'edit';
  /** Display reference shown under the title, e.g. '#POI-4022'. */
  reference: string;
  options: PoiFormOptions;
  initialValues: PoiFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: PoiFormValues) => Promise<void>;
  onClose: () => void;
}

const PoiForm: React.FC<Props> = ({
  mode,
  reference,
  options,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<PoiFormValues>(initialValues);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /** Set when onSubmit rejects, so the form can report it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  const demoRef = useRef<AccordionSectionHandle>(null);
  const contactsRef = useRef<AccordionSectionHandle>(null);
  const connectedRef = useRef<AccordionSectionHandle>(null);
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
      if (key === 'demo') demoRef.current?.open();
      if (key === 'contacts') contactsRef.current?.open();
      if (key === 'connected') connectedRef.current?.open();
    },
  });

  const set = <K extends keyof PoiFormValues>(
    key: K,
    value: PoiFormValues[K],
  ) => setValues(current => ({...current, [key]: value}));

  const setContact = (index: number, next: PoiFormValues['contacts'][0]) =>
    setValues(current => ({
      ...current,
      contacts: current.contacts.map((c, i) => (i === index ? next : c)),
    }));

  // Name, Person Type and the contact field are the three the design marks
  // required in Basic Details; !isSubmitting guards against double-submit.
  const canSubmit =
    values.name.trim().length > 0 &&
    values.personType.length > 0 &&
    values.contact.trim().length > 0 &&
    !isSubmitting;

  const title = mode === 'create' ? 'Create Person' : 'Edit Person';

  /**
   * The parent's mutation rejects on failure. Catching here rather than in each
   * parent means create and edit both report errors, and the form stays mounted
   * with the user's input intact so they can retry.
   */
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
            onPress={() =>
              mode === 'create' ? setConfirmDiscard(true) : onClose()
            }>
            {mode === 'create' ? (
              <XIcon size={19} color="#3A3F46" />
            ) : (
              <ChevronLeftIcon size={19} color="#3A3F46" />
            )}
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>{title}</Text>
            <Text style={formChrome.reference}>{reference}</Text>
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

            <View style={formChrome.field}>
              <FieldLabel label="Full Name" required />
              <TextField
                placeholder="Enter full name"
                value={values.name}
                onChangeText={next => set('name', next)}
              />
            </View>

            <DropdownField
              label="Person Type"
              required
              placeholder="Select person type"
              options={options.personTypes}
              value={values.personType}
              onChange={next => set('personType', next)}
            />

            <DropdownField
              label="Disposition"
              required
              placeholder="Select disposition"
              options={options.dispositions}
              value={values.disposition}
              onChange={next => set('disposition', next as PoiDisposition)}
              searchable={false}
            />

            <DateTimeField
              label="Date & Time"
              required
              value={values.occurredAt}
              onChange={next => set('occurredAt', next)}
            />

            <View style={formChrome.lastField}>
              <FieldLabel label="Phone Number or Email" required />
              <TextField
                placeholder="(303) 555-0142 or name@email.com"
                value={values.contact}
                onChangeText={next => set('contact', next)}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/*
            No Location section, on purpose: the design defines one for this
            form and never renders it, and the shipped app's person payload
            carries no address or zone either. Both are stamped server-side at
            create and shown read-only on the detail screen.
          */}

          {/* ---- Demographics ---- */}
          <AccordionSection
            ref={demoRef}
            title="Demographics"
            initiallyOpen
            onLayout={recordSectionY('demo')}>
            {/*
              The design puts this checkbox in the accordion's header row.
              AccordionSection has no header slot, and growing the shared
              primitive for one caller isn't worth it, so it leads the body.
            */}
            <TouchableOpacity
              style={styles.checkRow}
              activeOpacity={0.8}
              onPress={() => set('top1020', !values.top1020)}>
              <View
                style={[styles.checkBox, values.top1020 && styles.checkBoxOn]}>
                {values.top1020 ? (
                  <CheckIcon size={13} color={theme.colors.white} />
                ) : null}
              </View>
              <Text style={styles.checkLabel}>Top 10-20</Text>
            </TouchableOpacity>

            <Text style={styles.help}>
              Optional — record only what’s necessary and observed. Leave blank
              if unknown.
            </Text>

            <View style={formChrome.field}>
              <FieldLabel label="Alias" />
              <TextField
                placeholder="Known alias or nickname"
                value={values.alias}
                onChangeText={next => set('alias', next)}
              />
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Gender" />
              <SegmentedButtons
                options={options.genders.map(g => ({value: g, label: g}))}
                value={values.gender}
                onChange={next => set('gender', next)}
              />
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Age" />
              <TextField
                placeholder="Approximate age"
                value={values.age}
                onChangeText={next => set('age', next)}
                keyboardType="number-pad"
              />
            </View>

            <DropdownField
              label="Race"
              placeholder="Select race"
              options={options.races}
              value={values.race}
              onChange={next => set('race', next)}
              searchable={false}
            />

            <View style={formChrome.field}>
              <FieldLabel label="Weight (lbs)" />
              <TextField
                placeholder="Approximate weight"
                value={values.weight}
                onChangeText={next => set('weight', next)}
                keyboardType="number-pad"
              />
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Height" />
              <TextField
                placeholder={'e.g. 5\'10"'}
                value={values.height}
                onChangeText={next => set('height', next)}
              />
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Physical Description" />
              <TextField
                placeholder="e.g. clothing, build, notable features"
                value={values.physicalDescription}
                onChangeText={next => set('physicalDescription', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>

            <View style={formChrome.lastField}>
              <FieldLabel label="Situation" />
              <TextField
                placeholder="Describe the person’s current situation"
                value={values.situation}
                onChangeText={next => set('situation', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>
          </AccordionSection>

          {/* ---- Contacts ---- */}
          <AccordionSection
            ref={contactsRef}
            title="Contacts"
            initiallyOpen
            onLayout={recordSectionY('contacts')}>
            {values.contacts.map((contact, index) => (
              <ContactCard
                key={index}
                index={index}
                contact={contact}
                onChange={next => setContact(index, next)}
                onRemove={
                  values.contacts.length > 1
                    ? () =>
                        setValues(current => ({
                          ...current,
                          contacts: current.contacts.filter(
                            (_, i) => i !== index,
                          ),
                        }))
                    : undefined
                }
              />
            ))}
            <TouchableOpacity
              style={styles.addRow}
              activeOpacity={0.8}
              onPress={() =>
                setValues(current => ({
                  ...current,
                  contacts: [...current.contacts, EMPTY_CONTACT],
                }))
              }>
              <PlusIcon size={15} color={theme.colors.primary} />
              <Text style={styles.addText}>Add Contact</Text>
            </TouchableOpacity>
          </AccordionSection>

          {/* ---- Connected Elements ---- */}
          <AccordionSection
            ref={connectedRef}
            title="Connected Elements"
            initiallyOpen
            onLayout={recordSectionY('connected')}>
            <MultiDropdownField
              label="Incident"
              placeholder="Link an incident"
              options={options.incidentOptions}
              values={values.connectedIncidents}
              onChange={next => set('connectedIncidents', next)}
              searchable
            />
            <MultiDropdownField
              label="Maintenance"
              placeholder="Link maintenance"
              options={options.maintenanceOptions}
              values={values.connectedMaintenance}
              onChange={next => set('connectedMaintenance', next)}
              searchable
            />
            <MultiDropdownField
              label="Equipment"
              placeholder="Link equipment"
              options={options.equipmentOptions}
              values={values.connectedEquipment}
              onChange={next => set('connectedEquipment', next)}
              searchable
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
          onPress={() =>
            mode === 'create' ? setConfirmSubmit(true) : runSubmit()
          }>
          <Text style={formChrome.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmSubmit}
        title="Submit person?"
        message={`${reference} will be created and added to your Work Log and the POI list. You can edit it later from the details screen.`}
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
        title="Discard this person?"
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
        message="Something went wrong saving this person. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.text,
  },
  help: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.textMuted,
    marginBottom: 14,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
  },
  addText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
});

export default PoiForm;
