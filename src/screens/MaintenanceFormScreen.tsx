import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import CloseIcon from '../components/icons/CloseIcon';
import MaintenanceHeader from '../components/MaintenanceHeader';
import {theme} from '../theme';
import {skipToken} from '@reduxjs/toolkit/query/react';
import {useAppSelector} from '../redux/store';
import {
  useGetMaintenanceDropdownsQuery,
  useGetMaintenanceDetailQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from '../redux/maintenance/api';
import {getErrorMessage} from '../redux/api/queryFnHelpers';
import SegmentedControl from '../components/SegmentedControl';
import AssigneeTypeSelector from '../components/AssigneeTypeSelector';
import SearchablePickerSheet, {PickerOption} from '../components/SearchablePickerSheet';
import DateTimeField from '../components/DateTimeField';
import ImageUploadField, {UploadedImage} from '../components/ImageUploadField';
import ConfirmDialog from '../components/ConfirmDialog';
import {useHideTabBar} from '../hooks/useHideTabBar';
import {MaintenanceStackParamList} from '../navigation/MaintenanceNavigator';
import {MaintenancePriority, MaintenanceAssigneeType} from '../types/maintenance';

type Nav = NativeStackNavigationProp<MaintenanceStackParamList, 'MaintenanceForm'>;
type FormRoute = RouteProp<MaintenanceStackParamList, 'MaintenanceForm'>;

const MaintenanceFormScreen: React.FC = () => {
  useHideTabBar();
  const navigation = useNavigation<Nav>();
  const route = useRoute<FormRoute>();
  const isEdit = Boolean(route.params?.id);
  const {data: selected} = useGetMaintenanceDetailQuery(route.params?.id ?? skipToken);
  const {data: dropdowns = {types: [], departments: [], ambassadors: [], businesses: [], zones: []}} =
    useGetMaintenanceDropdownsQuery();
  const [createMaintenance, {isLoading: isCreating, error: createError}] = useCreateMaintenanceMutation();
  const [updateMaintenance, {isLoading: isUpdating, error: updateError}] = useUpdateMaintenanceMutation();
  const isSubmitting = isCreating || isUpdating;
  const submitError = getErrorMessage(createError) ?? getErrorMessage(updateError);
  const currentLocation = useAppSelector(state => state.location.currentLocation);

  const [activePicker, setActivePicker] = useState<'type' | 'assignee' | 'business' | 'zone' | null>(
    null,
  );
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [maintenanceType, setMaintenanceType] = useState<PickerOption | null>(null);
  const [requestDate, setRequestDate] = useState(new Date());
  const [assigneeType, setAssigneeType] = useState<MaintenanceAssigneeType | null>(null);
  const [assignee, setAssignee] = useState<PickerOption | null>(null);
  const [priority, setPriority] = useState<MaintenancePriority>('Low');
  const [zone, setZone] = useState<PickerOption | null>(null);
  const [describeLocation, setDescribeLocation] = useState('');
  const [business, setBusiness] = useState<PickerOption | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<UploadedImage | null>(null);

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

  const buildPayload = () => ({
    maintenance_type_id: maintenanceType?.id ?? '',
    request_date: requestDate.toISOString(),
    assignee_type: (assigneeType ?? 'Ambassador') as MaintenanceAssigneeType,
    user_id: assigneeType === 'Ambassador' ? assignee?.id : undefined,
    department_id: assigneeType === 'Department' ? assignee?.id : undefined,
    priority,
    address: currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : '',
    zone_id: zone?.id,
    location_description: describeLocation,
    business_location: business?.id,
    description,
    latitude: currentLocation?.latitude,
    longitude: currentLocation?.longitude,
  });

  const handleSave = () => {
    if (isEdit && route.params.id) {
      updateMaintenance({id: route.params.id, payload: buildPayload()})
        .unwrap()
        .then(() => navigation.goBack())
        .catch(() => {});
    } else {
      setConfirmVisible(true);
    }
  };

  const handleConfirmCreate = () => {
    setConfirmVisible(false);
    createMaintenance({payload: buildPayload(), image})
      .unwrap()
      .then(() => navigation.goBack())
      .catch(() => {});
  };

  const assigneeOptions: PickerOption[] =
    assigneeType === 'Department' ? dropdowns.departments : dropdowns.ambassadors;

  return (
    <View style={styles.root}>
      <MaintenanceHeader
        variant="gradient"
        title={isEdit ? 'Edit Maintenance' : 'Add Maintenance'}
        subtitle={isEdit && selected ? selected.ticket_number : undefined}
        left={
          <TouchableOpacity
            testID="maintenance-form-close"
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}>
            <CloseIcon size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
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
          <AssigneeTypeSelector
            testID="maintenance-assignee-type"
            value={assigneeType}
            onChange={value => {
              setAssigneeType(value);
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.addressRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.changeLocationText}>Change Location</Text>
          </View>
          <View style={styles.addressBox}>
            <Image source={require('../assets/icons/marker_pin.png')} style={styles.pinIcon} />
            <Text style={styles.addressText}>
              {currentLocation
                ? `${currentLocation.latitude}, ${currentLocation.longitude}`
                : 'Location unavailable'}
            </Text>
          </View>

          <Text style={styles.label}>Zone</Text>
          <TouchableOpacity
            testID="maintenance-zone-trigger"
            style={styles.input}
            onPress={() => setActivePicker('zone')}>
            <Text style={styles.value}>{zone?.label ?? 'Select zone'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
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
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.saveWrap}>
        <TouchableOpacity
          testID="maintenance-form-save"
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}>
          <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

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
        visible={activePicker === 'zone'}
        title="Zone"
        options={dropdowns.zones}
        onSelect={option => {
          setZone(option);
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {flex: 1},
  scrollContent: {padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xxl},
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
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
  addressRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  changeLocationText: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.xs, color: theme.colors.primary},
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  pinIcon: {width: 16, height: 16, marginTop: 2, tintColor: theme.colors.textMuted},
  addressText: {flex: 1, fontSize: theme.fontSize.base, fontFamily: theme.fonts.regular, color: '#111827'},
  saveWrap: {paddingBottom: theme.spacing.sm},
  saveBtn: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {fontFamily: theme.fonts.bold, color: theme.colors.white, fontSize: theme.fontSize.md},
});

export default MaintenanceFormScreen;
