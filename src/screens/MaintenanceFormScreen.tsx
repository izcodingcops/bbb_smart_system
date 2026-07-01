import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
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
import AssigneeTypeSelector from '../components/AssigneeTypeSelector';
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

  const wasSubmitting = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

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
    zone_id: zone?.id,
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

  const registerSectionOffset = (key: string) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const handleTabPress = (key: string) => {
    setActiveTab(key);
    const y = sectionOffsets.current[key] ?? 0;
    scrollRef.current?.scrollTo({y: Math.max(y - theme.spacing.md, 0), animated: true});
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y + 24;
    const entries = Object.entries(sectionOffsets.current).sort((a, b) => a[1] - b[1]);
    let current = entries[0]?.[0];
    for (const [key, offset] of entries) {
      if (y >= offset) {
        current = key;
      }
    }
    if (current && current !== activeTab) {
      setActiveTab(current);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity testID="maintenance-form-close" onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Maintenance' : 'Add Maintenance'}</Text>
          {isEdit && selected && <Text style={styles.headerSubtitle}>{selected.ticket_number}</Text>}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollSpyTabs tabs={TABS} activeKey={activeTab} onTabPress={handleTabPress} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        <View style={styles.card} onLayout={registerSectionOffset('basic')}>
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

        <View style={styles.card} onLayout={registerSectionOffset('location')}>
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

        <View style={styles.card} onLayout={registerSectionOffset('other')}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  closeText: {fontSize: 18, fontFamily: theme.fonts.bold, color: theme.colors.textMuted},
  headerTitleGroup: {alignItems: 'center'},
  headerTitle: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.md, color: theme.colors.text},
  headerSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  headerSpacer: {width: 24},
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
