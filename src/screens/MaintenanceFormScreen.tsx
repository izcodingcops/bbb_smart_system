import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {theme} from '../theme';
import {useAppDispatch, useAppSelector} from '../redux/store';
import {
  requestMaintenanceDropdowns,
  requestMaintenanceCreate,
  requestMaintenanceEdit,
} from '../redux/maintenance/actions';
import {
  GetMaintenanceDropdowns,
  GetSelectedMaintenance,
  GetMaintenanceSubmitting,
  GetMaintenanceSubmitError,
} from '../redux/maintenance/selectors';
import SegmentedControl from '../components/SegmentedControl';
import SearchablePickerSheet, {PickerOption} from '../components/SearchablePickerSheet';
import DateTimeField from '../components/DateTimeField';
import ImageUploadField, {UploadedImage} from '../components/ImageUploadField';
import ConfirmDialog from '../components/ConfirmDialog';
import ScrollSpyTabs from '../components/ScrollSpyTabs';
import {MaintenanceStackParamList} from '../navigation/MaintenanceNavigator';
import {MaintenancePriority, MaintenanceAssigneeType} from '../types/maintenance';

type Nav = NativeStackNavigationProp<MaintenanceStackParamList, 'MaintenanceForm'>;
type FormRoute = RouteProp<MaintenanceStackParamList, 'MaintenanceForm'>;

const TABS = [
  {key: 'basic', label: 'Basic Details'},
  {key: 'location', label: 'Location Details'},
  {key: 'other', label: 'Other Details'},
];

const MaintenanceFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<FormRoute>();
  const dispatch = useAppDispatch();
  const isEdit = Boolean(route.params?.id);
  const selected = GetSelectedMaintenance();
  const dropdowns = GetMaintenanceDropdowns();
  const isSubmitting = GetMaintenanceSubmitting();
  const submitError = GetMaintenanceSubmitError();
  const currentLocation = useAppSelector(state => state.location.currentLocation);

  const [activeTab, setActiveTab] = useState('basic');
  const [activePicker, setActivePicker] = useState<'type' | 'assignee' | 'business' | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [maintenanceType, setMaintenanceType] = useState<PickerOption | null>(null);
  const [requestDate, setRequestDate] = useState(new Date());
  const [assigneeType, setAssigneeType] = useState<MaintenanceAssigneeType | null>(null);
  const [assignee, setAssignee] = useState<PickerOption | null>(null);
  const [priority, setPriority] = useState<MaintenancePriority>('Low');
  const [describeLocation, setDescribeLocation] = useState('');
  const [business, setBusiness] = useState<PickerOption | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<UploadedImage | null>(null);

  const wasSubmitting = useRef(false);

  useEffect(() => {
    dispatch(requestMaintenanceDropdowns());
  }, [dispatch]);

  useEffect(() => {
    if (isEdit && selected) {
      setMaintenanceType({id: selected.maintenance_type_id, label: String(selected.maintenance_type_id)});
      setRequestDate(new Date(selected.request_date));
      setAssigneeType(selected.assignee_type);
      setPriority(selected.priority);
      setDescribeLocation(selected.location_description ?? '');
      setDescription(selected.description ?? '');
    }
  }, [isEdit, selected]);

  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting && !submitError) {
      navigation.goBack();
    }
    wasSubmitting.current = isSubmitting;
  }, [isSubmitting, submitError, navigation]);

  const buildPayload = () => ({
    maintenance_type_id: maintenanceType?.id ?? '',
    request_date: requestDate.toISOString(),
    assignee_type: (assigneeType ?? 'Ambassador') as MaintenanceAssigneeType,
    user_id: assigneeType === 'Ambassador' ? assignee?.id : undefined,
    department_id: assigneeType === 'Department' ? assignee?.id : undefined,
    priority,
    address: currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : '',
    location_description: describeLocation,
    business_location: business?.id,
    description,
    latitude: currentLocation?.latitude,
    longitude: currentLocation?.longitude,
  });

  const handleSave = () => {
    if (isEdit && route.params.id) {
      dispatch(requestMaintenanceEdit(route.params.id, buildPayload()));
    } else {
      setConfirmVisible(true);
    }
  };

  const handleConfirmCreate = () => {
    setConfirmVisible(false);
    dispatch(requestMaintenanceCreate(buildPayload(), image));
  };

  const assigneeOptions: PickerOption[] =
    assigneeType === 'Department' ? dropdowns.departments : dropdowns.ambassadors;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity testID="maintenance-form-close" onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Maintenance' : 'Add Maintenance'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollSpyTabs tabs={TABS} activeKey={activeTab} onTabPress={setActiveTab} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'basic' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            <Text style={styles.label}>Maintenance Type</Text>
            <TouchableOpacity
              testID="maintenance-type-trigger"
              style={styles.input}
              onPress={() => setActivePicker('type')}>
              <Text style={styles.value}>{maintenanceType?.label ?? 'Select maintenance type'}</Text>
            </TouchableOpacity>

            <DateTimeField
              label="Request Date & Time"
              value={requestDate}
              onChange={setRequestDate}
              testID="maintenance-request-date"
            />

            <Text style={styles.label}>Choose Assignee</Text>
            <SegmentedControl
              testID="maintenance-assignee-type"
              options={[
                {label: 'Ambassador', value: 'Ambassador'},
                {label: 'Department', value: 'Department'},
              ]}
              value={assigneeType}
              onChange={value => {
                setAssigneeType(value as MaintenanceAssigneeType);
                setAssignee(null);
              }}
            />
            {assigneeType && (
              <TouchableOpacity
                testID="maintenance-assignee-trigger"
                style={styles.input}
                onPress={() => setActivePicker('assignee')}>
                <Text style={styles.value}>
                  {assignee?.label ?? `Select ${assigneeType.toLowerCase()}`}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Priority</Text>
            <SegmentedControl
              testID="maintenance-priority"
              options={[
                {label: 'Low', value: 'Low'},
                {label: 'Medium', value: 'Medium'},
                {label: 'High', value: 'High'},
              ]}
              value={priority}
              onChange={value => setPriority(value as MaintenancePriority)}
            />
          </View>
        )}

        {activeTab === 'location' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>
              {currentLocation
                ? `${currentLocation.latitude}, ${currentLocation.longitude}`
                : 'Location unavailable'}
            </Text>
          </View>
        )}

        {activeTab === 'other' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Details</Text>
            <Text style={styles.label}>Describe Location</Text>
            <TextInput
              testID="maintenance-describe-location"
              style={styles.input}
              placeholder="Enter location"
              value={describeLocation}
              onChangeText={setDescribeLocation}
            />
            <Text style={styles.label}>Business Name</Text>
            <TouchableOpacity
              testID="maintenance-business-trigger"
              style={styles.input}
              onPress={() => setActivePicker('business')}>
              <Text style={styles.value}>{business?.label ?? 'Select business name'}</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Description</Text>
            <TextInput
              testID="maintenance-description"
              style={[styles.input, styles.textarea]}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={styles.label}>Image</Text>
            <ImageUploadField value={image} onChange={setImage} testID="maintenance-image" />
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        testID="maintenance-form-save"
        style={styles.saveBtn}
        onPress={handleSave}
        activeOpacity={0.85}>
        <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>
      </TouchableOpacity>

      <SearchablePickerSheet
        visible={activePicker === 'type'}
        title="Maintenance Type"
        options={dropdowns.types}
        onSelect={option => {
          setMaintenanceType(option);
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />
      <SearchablePickerSheet
        visible={activePicker === 'assignee'}
        title={assigneeType ?? ''}
        options={assigneeOptions}
        onSelect={option => {
          setAssignee(option);
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />
      <SearchablePickerSheet
        visible={activePicker === 'business'}
        title="Business Name"
        options={dropdowns.businesses}
        onSelect={option => {
          setBusiness(option);
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Save Maintenance"
        message="Do you want to save this maintenance?"
        confirmLabel="Save"
        onConfirm={handleConfirmCreate}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  closeText: {fontSize: 18, fontFamily: theme.fonts.bold, color: theme.colors.textMuted},
  headerTitle: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.md, color: theme.colors.text},
  headerSpacer: {width: 24},
  scroll: {flex: 1},
  scrollContent: {padding: theme.spacing.lg, gap: theme.spacing.md},
  section: {gap: theme.spacing.md},
  sectionTitle: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.md, color: theme.colors.text},
  label: {fontSize: theme.fontSize.xs + 2, fontFamily: theme.fonts.bold, color: '#374151'},
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  textarea: {minHeight: 96, textAlignVertical: 'top'},
  value: {fontSize: theme.fontSize.base, fontFamily: theme.fonts.regular, color: '#111827'},
  saveBtn: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {fontFamily: theme.fonts.bold, color: theme.colors.white, fontSize: theme.fontSize.md},
});

export default MaintenanceFormScreen;
