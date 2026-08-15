import React, {useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  AccordionSection,
  AccordionSectionHandle,
  ConfirmDialog,
  DateTimeField,
  DropdownField,
  FieldLabel,
  MultiDropdownField,
  SectionTabItem,
  SectionTabs,
  SegmentedButtons,
  TextField,
  Toast,
  UploadField,
  formChrome,
} from '../../../components/ui';
import {ChevronLeftIcon, XIcon} from '../../../components/icons';
import {useSectionScrollTabs} from '../../../hooks/useSectionScrollTabs';
import {useFormDiscardState} from '../../../hooks/useFormDiscardState';
import {
  EquipmentDetail,
  EquipmentFormOptions,
  EquipmentFormValues,
  EquipmentOwnership,
  EquipmentUnit,
} from '../../../types/equipment';
import {equipmentFormChrome} from '../equipmentFormChrome';
import {theme} from '../../../theme';

/** Section jump tabs, in the order the sections actually appear on screen. */
const SECTION_TABS: SectionTabItem[] = [
  {key: 'basic', label: 'Basic'},
  {key: 'other', label: 'Other'},
  {key: 'connected', label: 'Connected'},
];

/**
 * Create starts blank; edit starts from the saved record.
 *
 * `options` is part of the signature so both call sites read the same and so a
 * future create-time default (a pre-selected unit, say) has somewhere to come
 * from — nothing needs it today.
 */
export function buildInitialValues(
  options: EquipmentFormOptions,
  detail?: EquipmentDetail,
): EquipmentFormValues {
  if (detail) {
    return {
      serial: detail.serial,
      name: detail.name,
      /*
       * Nullable on the record but required by the form — the seeded records
       * predate the create flow. Falling back to now keeps those records
       * editable instead of making Date Acquired unfillable.
       */
      acquiredAt: detail.acquiredAt ?? new Date().toISOString(),
      category: detail.category,
      equipmentType: detail.equipmentType,
      make: detail.make,
      model: detail.model,
      unit: detail.unit,
      ownership: detail.ownership,
      fuel: detail.fuel,
      year: detail.year ?? '',
      beginningUsage: detail.beginningUsage ?? '',
      // `zone` is a non-null '' on a record with no zone; the dropdown wants
      // null there so it renders its placeholder rather than a blank control.
      zone: detail.zone.length > 0 ? detail.zone : null,
      description: detail.description ?? '',
      images: detail.images,
      incidents: detail.incidents,
      personsOfInterest: detail.personsOfInterest,
      maintenance: detail.maintenance,
    };
  }
  return {
    serial: '',
    name: '',
    acquiredAt: new Date().toISOString(),
    category: '',
    equipmentType: '',
    make: '',
    model: '',
    unit: '',
    ownership: '',
    fuel: null,
    year: '',
    beginningUsage: '',
    zone: null,
    description: '',
    images: [],
    incidents: [],
    personsOfInterest: [],
    maintenance: [],
  };
}

interface Props {
  mode: 'create' | 'edit';
  /** Display reference shown under the title, e.g. '#4366'. */
  reference: string;
  options: EquipmentFormOptions;
  initialValues: EquipmentFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
  onClose: () => void;
}

const EquipmentForm: React.FC<Props> = ({
  mode,
  reference,
  options,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<EquipmentFormValues>(initialValues);
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

  const otherRef = useRef<AccordionSectionHandle>(null);
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
    // Jumping to a collapsed section would scroll to a header with nothing
    // under it, so force the matching accordion open first.
    onSelect: key => {
      if (key === 'other') {
        otherRef.current?.open();
      }
      if (key === 'connected') {
        connectedRef.current?.open();
      }
    },
  });

  /*
   * Category → Type → Make → Model is derived from the current values rather
   * than mirrored into state, which makes an inconsistent chain (a Model that
   * isn't under the chosen Make) unrepresentable.
   */
  const typeOptions = useMemo(
    () => options.categories.find(c => c.name === values.category)?.types ?? [],
    [options.categories, values.category],
  );
  const makeOptions = useMemo(
    () => typeOptions.find(t => t.name === values.equipmentType)?.makes ?? [],
    [typeOptions, values.equipmentType],
  );
  const modelOptions = useMemo(
    () => makeOptions.find(m => m.name === values.make)?.models ?? [],
    [makeOptions, values.make],
  );

  const set = <K extends keyof EquipmentFormValues>(
    key: K,
    value: EquipmentFormValues[K],
  ) => {
    setValues(current => ({...current, [key]: value}));
    setTouched(true);
  };

  /*
   * Each of the three handlers below clears *every* descendant, not just its
   * immediate child: the old type almost certainly isn't under the new
   * category, and leaving a stale Model hanging under a changed Type would
   * submit a combination the taxonomy does not contain.
   */
  const handleCategoryChange = (category: string) => {
    setValues(current => ({
      ...current,
      category,
      equipmentType: '',
      make: '',
      model: '',
    }));
    setTouched(true);
  };

  const handleTypeChange = (equipmentType: string) => {
    setValues(current => ({...current, equipmentType, make: '', model: ''}));
    setTouched(true);
  };

  const handleMakeChange = (make: string) => {
    setValues(current => ({...current, make, model: ''}));
    setTouched(true);
  };

  // The design's required set. Date Acquired is auto-filled, so it is never
  // what blocks a submit; !isSubmitting guards against a double-submit.
  const canSubmit =
    !isSubmitting &&
    values.serial.trim().length > 0 &&
    values.name.trim().length > 0 &&
    values.category.length > 0 &&
    values.equipmentType.length > 0 &&
    values.make.length > 0 &&
    values.model.length > 0 &&
    values.ownership.length > 0 &&
    values.unit.length > 0;

  const title = mode === 'create' ? 'Add Equipment' : 'Edit Equipment';

  /**
   * The parent's mutation rejects on failure. Catching here rather than in
   * each parent means create and edit both report the error, and the form
   * stays mounted with the user's input intact so they can retry.
   */
  const runSubmit = async () => {
    setConfirmSubmit(false);
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
            onPress={mode === 'create' ? handleClose : onClose}>
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
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          {/* ---- Basic Details ---- */}
          <View style={formChrome.section} onLayout={recordSectionY('basic')}>
            <Text style={formChrome.sectionTitle}>Basic Details</Text>

            <View style={formChrome.field}>
              <FieldLabel label="Serial No / Vehicle No" required />
              <TextField
                placeholder="e.g. SN-88213 or VIN"
                value={values.serial}
                onChangeText={next => set('serial', next)}
                autoCapitalize="characters"
              />
              <Text style={styles.help}>
                Printed on the equipment tag or vehicle plate.
              </Text>
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Equipment Name" required />
              <TextField
                placeholder="e.g. Transit Van 04"
                value={values.name}
                onChangeText={next => set('name', next)}
              />
            </View>

            <DateTimeField
              label="Date Acquired"
              required
              value={values.acquiredAt}
              onChange={next => set('acquiredAt', next)}
            />

            <DropdownField
              label="Category"
              required
              placeholder="Select category"
              options={options.categories.map(c => c.name)}
              value={values.category}
              onChange={handleCategoryChange}
              searchable
            />

            <DropdownField
              label="Type"
              required
              placeholder="Select type"
              options={typeOptions.map(t => t.name)}
              value={values.equipmentType}
              onChange={handleTypeChange}
              searchable={false}
              disabled={!values.category}
              helperText={!values.category ? 'Select a category first.' : undefined}
            />

            <DropdownField
              label="Make"
              required
              placeholder="Select make"
              options={makeOptions.map(m => m.name)}
              value={values.make}
              onChange={handleMakeChange}
              searchable={false}
              disabled={!values.equipmentType}
              helperText={
                !values.equipmentType ? 'Select a type first.' : undefined
              }
            />

            <DropdownField
              label="Model"
              required
              placeholder="Select model"
              options={modelOptions}
              value={values.model}
              onChange={next => set('model', next)}
              searchable={false}
              disabled={!values.make}
              helperText={!values.make ? 'Select a make first.' : undefined}
            />

            <DropdownField
              label="Unit"
              required
              placeholder="Select unit"
              options={options.units}
              value={values.unit}
              onChange={next => set('unit', next as EquipmentUnit)}
              searchable={false}
            />

            <View style={formChrome.lastField}>
              <DropdownField
                label="Ownership Status"
                required
                placeholder="Select ownership status"
                options={options.ownerships}
                value={values.ownership}
                onChange={next => set('ownership', next as EquipmentOwnership)}
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
            <View style={formChrome.field}>
              <FieldLabel label="Vehicle is on" />
              <SegmentedButtons
                options={options.fuels.map(f => ({value: f, label: f}))}
                value={values.fuel ?? ''}
                onChange={next => set('fuel', next)}
              />
            </View>

            {/*
              The design puts Year and Miles/Hours side by side. They stack
              here instead — no other form in this app has a two-up row, and
              adding the layout primitive for two fields isn't worth it.
            */}
            <View style={formChrome.field}>
              <FieldLabel label="Year" />
              <TextField
                placeholder="YYYY"
                value={values.year}
                onChangeText={next => set('year', next)}
                keyboardType="number-pad"
              />
            </View>

            <View style={formChrome.field}>
              <FieldLabel label="Miles/Hours" />
              <TextField
                placeholder="e.g. 12,480"
                value={values.beginningUsage}
                onChangeText={next => set('beginningUsage', next)}
              />
            </View>

            <DropdownField
              label="Zone"
              placeholder="Select zone"
              options={options.zones}
              value={values.zone}
              onChange={next => set('zone', next)}
              searchable={false}
            />

            <View style={formChrome.field}>
              <FieldLabel label="Description" />
              <TextField
                placeholder="Add any notes about this equipment…"
                value={values.description}
                onChangeText={next => set('description', next)}
                multiline
                numberOfLines={4}
                style={formChrome.textarea}
              />
            </View>

            <View style={formChrome.lastField}>
              <UploadField
                label="Images"
                uris={values.images}
                onChange={next => set('images', next)}
                subtitle="PNG or JPG · up to 10 MB"
              />
            </View>
          </AccordionSection>

          {/* ---- Connected Elements ---- */}
          <AccordionSection
            ref={connectedRef}
            title="Connected Elements"
            initiallyOpen
            onLayout={recordSectionY('connected')}>
            {/*
              No '+ Add Incident / POI / Maintenance' affordances: the design's
              are no-ops, and there is no cross-module create to route to.
            */}
            <MultiDropdownField
              label="Incident"
              placeholder="Select incident"
              options={options.incidents}
              values={values.incidents}
              onChange={next => set('incidents', next)}
              searchable
            />
            <MultiDropdownField
              label="Person of Interest"
              placeholder="Select person of interest"
              options={options.personsOfInterest}
              values={values.personsOfInterest}
              onChange={next => set('personsOfInterest', next)}
              searchable
            />
            <MultiDropdownField
              label="Maintenance"
              placeholder="Select maintenance"
              options={options.maintenance}
              values={values.maintenance}
              onChange={next => set('maintenance', next)}
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
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        title="Add this equipment?"
        message={
          <Text>
            Equipment{' '}
            <Text style={equipmentFormChrome.bold}>{reference}</Text> will be
            added to the equipment list. You can edit it later from its details
            screen.
          </Text>
        }
        confirmLabel={submitLabel}
        onConfirm={runSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        title="Discard this equipment?"
        message="You have unsaved details. If you leave now, everything you entered on this form will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={confirmDiscardAndClose}
        onCancel={() => setConfirmDiscard(false)}
      />

      <Toast
        visible={submitFailed}
        title="Couldn't save"
        message="Something went wrong saving this equipment. Check your connection and try again."
        variant="danger"
        onDismiss={() => setSubmitFailed(false)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  // Matches DropdownField's own helper line, so the two read as one treatment.
  help: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: 7,
  },
});

export default EquipmentForm;
