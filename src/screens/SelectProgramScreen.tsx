import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo, { getDeviceId } from 'react-native-device-info';
import { useAppDispatch } from '../redux/store';
import {
  GetPrograms,
  GetSelectedProgram,
  GetProgramLoading,
} from '../redux/program/selectors';
import { GetUser } from '../redux/auth/selectors';
import { requestProgramList, selectProgram } from '../redux/program/actions';
import { logout } from '../redux/auth/actions';
import { updateLocation } from '../redux/location/actions';
import { Program, TaskItem } from '../types/program';
import { programService } from '../api/services/programService';
import { shiftService } from '../api/services/shiftService';
import { locationService } from '../api/services/locationService';
import { locationTracker } from '../utils/locationTracker';
import { ensurePermissions } from '../utils/permissionFlow';
import { toServerDate } from '../utils/dateUtil';
import { setActiveProgramId } from '../api/headerContext';
import { MicroService } from '../api/microService';
import { ApiEndpoints } from '../api/apiEndpoints';
import { logger } from '../utils/logger';
import PositionModal from '../components/PositionModal';
import ShiftTimeModal from '../components/ShiftTimeModal';

const SelectProgramScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const programs = GetPrograms();
  const selectedProgram = GetSelectedProgram();
  const isLoading = GetProgramLoading();
  const user = GetUser();

  const [search, setSearch] = useState('');

  // Position modal state
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [activeProgramItem, setActiveProgramItem] = useState<Program | null>(
    null,
  );

  // Shift modal state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isShiftLoading, setIsShiftLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [selectProgramRes, setSelectProgramRes] = useState<any>(null);

  useEffect(() => {
    dispatch(requestProgramList());
    // iOS location authorization is requested natively by
    // BBBLocationManager.verifyPermissions() (called at launch and on every
    // foreground in AppDelegate), so no JS-side request is needed here.
  }, [dispatch]);

  const pingLocationAfterShift = async (
    sessionId: string | number,
    shiftId: string | number,
    userId: string | number,
  ) => {
    // Permissions are guaranteed granted by handleShiftConfirm before we get here.
    const deviceName = await DeviceInfo.getDeviceName();
    const deviceId = getDeviceId();

    // Start continuous native tracking FIRST. This is what saves the session
    // natively and starts GPS, so it must NOT be gated behind the one-shot
    // getCurrentLocation ping below — on a fresh install that dependency threw
    // and silently skipped startTracking, so the app never tracked at all.
    locationTracker.startTracking({
      sessionId,
      deviceId,
      deviceType: Platform.OS,
      deviceName,
      shiftId,
      horizontal_accuracy: 1,
      user_id: userId,
      cube_url: `${MicroService.BASE_APP_API}${ApiEndpoints.addBulkGeoData}`,
      timezone_str: activeProgramItem?.timezone_str ?? 'America/New_York',
    });

    // Best-effort initial geo-ping. Skipped if a one-shot fix isn't available.
    try {
      const pos = await locationTracker.getCurrentLocation();
      const { latitude, longitude, accuracy, altitude, heading, timestamp } =
        pos;
      dispatch(
        updateLocation({
          latitude,
          longitude,
          altitude: altitude ?? null,
          horizontalAccuracy: accuracy,
          verticalAccuracy: null,
          heading: heading ?? null,
          timestamp,
        }),
      );
      await locationService.addGeoData({
        sessionId,
        latitude,
        longitude,
        deviceId,
        deviceType: Platform.OS,
        deviceName,
        shiftId,
        horizontal_accuracy: accuracy ?? 1,
        user_id: userId,
      });
      logger.info('SelectProgramScreen', 'Location ping sent successfully');
    } catch (err) {
      logger.warn('SelectProgramScreen', 'initial ping skipped', err);
    }
  };

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(p => p.program_name.toLowerCase().includes(q));
  }, [programs, search]);

  const handleProgramSelect = async (program: Program) => {
    setActiveProgramItem(program);
    setShowPositionModal(true);
    setIsTaskLoading(true);
    setTaskList([]);
    try {
      logger.debug(
        'SelectProgramScreen',
        'Fetching task list for program',
        program.id,
      );
      const response = await programService.getTaskList(program.id);
      // API shape: { status, message, data: { count, rows: [...] } }
      const tasks = response.data?.rows ?? [];
      logger.info('SelectProgramScreen', `Loaded ${tasks.length} tasks`);
      setTaskList(tasks);
    } catch (error) {
      logger.error('SelectProgramScreen', 'Failed to fetch task list', error);
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handlePositionSelect = async (task: TaskItem) => {
    if (!activeProgramItem) return;
    setSelectedTask(task);
    setIsTaskLoading(true);
    try {
      logger.debug('SelectProgramScreen', 'Calling selectProgram-v2', {
        programId: activeProgramItem.id,
        shiftId: task.id,
      });
      const response = await programService.selectProgram(
        activeProgramItem.id,
        task.id,
      );
      logger.info(
        'SelectProgramScreen',
        'selectProgram-v2 response',
        response.status,
      );

      if (response.status !== 200) {
        setIsTaskLoading(false);
        return;
      }

      setSelectProgramRes(response.data);
      setIsTaskLoading(false);

      const enableShiftEntry =
        user?.enable_shift_entry && activeProgramItem.shift_enabled;
      if (enableShiftEntry) {
        // iOS can't present one Modal while another is still dismissing — wait
        // for the position sheet's close animation to finish before opening the
        // shift sheet, otherwise the app deadlocks behind a stuck dim backdrop.
        setShowPositionModal(false);
        setTimeout(() => setShowShiftModal(true), 300);
      } else {
        // No shift modal — sessionId = selectProgram response id, and no
        // shift was started so shiftId is '0' (matches production's
        // startShiftResponseData fallback).
        if (user?.id) {
          pingLocationAfterShift(response.data.id, '0', user.id);
        }
        setShowPositionModal(false);
        dispatch(selectProgram(activeProgramItem));
      }
    } catch (error) {
      logger.error('SelectProgramScreen', 'selectProgram-v2 failed', error);
      setIsTaskLoading(false);
    }
  };

  // Populate state.location.currentLocation before any API call goes out —
  // the request interceptor reads lat/lon/altitude/etc. from there, and the
  // backend hangs (timeout) when those headers are empty strings.
  const ensureLocationInStore = async (): Promise<void> => {
    try {
      const pos = await locationTracker.getCurrentLocation();
      dispatch(
        updateLocation({
          latitude: pos.latitude,
          longitude: pos.longitude,
          altitude: pos.altitude ?? null,
          horizontalAccuracy: pos.accuracy,
          verticalAccuracy: null,
          heading: pos.heading ?? null,
          timestamp: pos.timestamp,
        }),
      );
    } catch (err) {
      logger.error('SelectProgramScreen', 'ensureLocationInStore failed', err);
      // proceed without location; request will use empty strings
    }
  };

  const handleShiftConfirm = async (startTime: Date, endTime: Date) => {
    if (!activeProgramItem || !selectedTask) return;
    setIsShiftLoading(true);
    // Make program_id available to the request interceptor without
    // dispatching selectProgram (which would navigate to home before we
    // know whether the request succeeded).
    setActiveProgramId(activeProgramItem.id);
    try {
      // Prompt for location/activity perms before anything that needs GPS.
      const granted = await ensurePermissions();
      if (!granted) {
        logger.warn(
          'SelectProgramScreen',
          'Permissions not granted — cannot start shift',
        );
        setIsShiftLoading(false);
        return;
      }
      await ensureLocationInStore();
      // Backend hangs when the timestamp offset doesn't match `timezone_str`.
      // Always use the PROGRAM's timezone for the offset, never the device's
      // local timezone — matches old app's `convertTimeZoneFormat` which
      // uses moment-timezone keyed to the program city.
      const tz = activeProgramItem.timezone_str ?? 'America/New_York';
      const body = {
        actual_shift_date: toServerDate(startTime, tz),
        actual_shift_end_date: toServerDate(endTime, tz),
        task_id: selectedTask.id,
        program_id: activeProgramItem.id,
        timezone_str: tz,
        server_date: toServerDate(new Date(), tz),
      };
      logger.debug('SelectProgramScreen', 'Starting shift', body);
      const response = await shiftService.startShift(body);
      logger.info('SelectProgramScreen', 'Shift started', response.status);
      // Only on success: commit selectedProgram to redux so the navigator
      // transitions to the home stack.
      dispatch(selectProgram(activeProgramItem));
      // Match the production app's ID mapping (bbb_mobile_application
      // HomeNew/index.js): sessionId = select-program response id,
      // shiftId = start-shift response id. Sending these swapped (or task.id
      // as shiftId) makes the web map query the wrong IDs and points never
      // render even though the backend stores them.
      if (user?.id && selectProgramRes?.id && response.data?.id) {
        pingLocationAfterShift(selectProgramRes.id, response.data.id, user.id);
      }
    } catch (error) {
      logger.error('SelectProgramScreen', 'Start shift failed', error);
    } finally {
      setActiveProgramId(undefined);
      setIsShiftLoading(false);
      setShowShiftModal(false);
    }
  };

  const renderItem = ({ item }: { item: Program }) => {
    const isSelected = selectedProgram?.id === item.id;
    return (
      <TouchableOpacity
        className={`mx-4 mb-2.5 rounded-xl px-4 py-4 flex-row justify-between items-center border ${
          isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => handleProgramSelect(item)}
        activeOpacity={0.7}
      >
        <Text
          className={`flex-1 text-[15px] ${
            isSelected ? 'text-primary font-semibold' : 'text-gray-900'
          }`}
          numberOfLines={1}
        >
          {item.program_name}
        </Text>
        {isSelected && (
          <Text className="text-primary font-bold text-lg ml-3">✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">
          Select A Program
        </Text>
        <TouchableOpacity
          className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
          onPress={() => dispatch(logout())}
        >
          <Text className="text-gray-500 text-base font-bold">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="mx-4 mt-3 mb-2 flex-row items-center bg-gray-100 rounded-xl px-4">
        <Text className="text-gray-400 mr-2 text-base">⌕</Text>
        <TextInput
          className="flex-1 py-3 text-[15px] text-gray-900"
          placeholder="Search by Program Name"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text className="text-gray-400 text-base">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Program Banner */}
      {selectedProgram && !search && (
        <View className="mx-4 mt-2 mb-1 bg-blue-50 border border-primary rounded-xl px-4 py-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
              Selected Program
            </Text>
            <Text
              className="text-[15px] text-gray-900 font-medium"
              numberOfLines={1}
            >
              {selectedProgram.program_name}
            </Text>
          </View>
          <Text className="text-primary font-bold text-xl ml-3">✓</Text>
        </View>
      )}

      {isLoading && programs.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D4889" />
          <Text className="text-gray-400 mt-3 text-sm">Loading programs…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrograms}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={() => (
            <View className="px-4 py-3">
              <Text className="text-gray-500 text-sm font-medium">
                {filteredPrograms.length} Available Program
                {filteredPrograms.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-400 text-base">No programs found</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      <PositionModal
        visible={showPositionModal}
        tasks={taskList}
        isLoading={isTaskLoading}
        programName={activeProgramItem?.program_name ?? ''}
        onSelect={handlePositionSelect}
        onClose={() => setShowPositionModal(false)}
      />

      <ShiftTimeModal
        visible={showShiftModal}
        isLoading={isShiftLoading}
        timeZone={activeProgramItem?.timezone_str ?? 'America/New_York'}
        onConfirm={handleShiftConfirm}
        onClose={() => setShowShiftModal(false)}
      />
    </SafeAreaView>
  );
};

export default SelectProgramScreen;
