import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import TimePickerSheet from '../../components/TimePickerSheet';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {PrimaryButton} from '../../components/ui';
import {useAppDispatch} from '../../redux/store';
import {GetActiveProgram, GetShiftTypes} from '../../redux/auth/selectors';
import {startShift} from '../../redux/shift/slice';
import {logout} from '../../redux/auth/slice';
import type {SetupStackParamList} from '../../navigation/SetupNavigator';
import {ShiftType} from '../../types/shift';
import MapPinIcon from '../../components/icons/MapPinIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import PlayIcon from '../../components/icons/PlayIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import ChevronRightIcon from '../../components/icons/ChevronRightIcon';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import CleaningIcon from '../../components/icons/CleaningIcon';
import GeneralIcon from '../../components/icons/GeneralIcon';
import HospitalityIcon from '../../components/icons/HospitalityIcon';
import ManagementIcon from '../../components/icons/ManagementIcon';
import OutreachIcon from '../../components/icons/OutreachIcon';
import SafetyIcon from '../../components/icons/SafetyIcon';
import {SHIFT_HOURS, SHIFT_MS} from '../../constants/shift';
import {formatWhen} from '../../utils/time';
import {theme} from '../../theme';

const SHIFT_ICONS: Record<
  string,
  React.FC<{size?: number; color?: string}>
> = {
  cleaning: CleaningIcon,
  general: GeneralIcon,
  hospitality: HospitalityIcon,
  management: ManagementIcon,
  outreach: OutreachIcon,
  safety: SafetyIcon,
};

const ShiftSetupScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<SetupStackParamList>>();
  const program = GetActiveProgram();
  const shiftTypes = GetShiftTypes();

  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    shiftTypes[0]?.id ?? '',
  );
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [autoEnd, setAutoEnd] = useState(true);
  const [manualStopTime, setManualStopTime] = useState<Date | null>(null);
  const [picker, setPicker] = useState<'start' | 'stop' | null>(null);

  const autoStopTime = new Date(startTime.getTime() + SHIFT_MS);
  // When auto-end is on the stop time is derived; otherwise the user picks it.
  const stopTime = autoEnd ? autoStopTime : manualStopTime ?? autoStopTime;
  // Multi-program users reach this screen via ProgramSelection (so back/change
  // and a "Step 2 of 2" indicator apply). Single-program users start here.
  const cameFromSelection = navigation.canGoBack();

  const onConfirmTime = (date: Date) => {
    if (picker === 'stop') {
      setManualStopTime(date);
    } else {
      setStartTime(date);
    }
    setPicker(null);
  };

  const toggleAutoEnd = () => {
    setAutoEnd(prev => {
      // Seed the manual stop with the current auto value when switching off.
      if (prev && !manualStopTime) {
        setManualStopTime(autoStopTime);
      }
      return !prev;
    });
  };

  const handleStart = () => {
    if (!selectedTypeId) {
      return;
    }
    dispatch(
      startShift({
        shiftTypeId: selectedTypeId,
        startTime: startTime.toISOString(),
        stopTime: stopTime.toISOString(),
        autoEnd,
      }),
    );
  };

  const singleShiftType = shiftTypes.length === 1;

  const renderSingleShiftType = (type: ShiftType) => {
    const Icon = SHIFT_ICONS[type.icon] ?? GeneralIcon;
    return (
      <View style={styles.singleTypeCard}>
        <View style={styles.programPin}>
          <Icon size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.programText}>
          <Text style={styles.programLabel}>POSITION / SHIFT TYPE</Text>
          <Text style={styles.programName}>{type.name}</Text>
        </View>
      </View>
    );
  };

  const renderShiftType = (type: ShiftType) => {
    const selected = type.id === selectedTypeId;
    const Icon = SHIFT_ICONS[type.icon] ?? GeneralIcon;
    return (
      <TouchableOpacity
        key={type.id}
        style={[styles.typeCard, selected && styles.typeCardSelected]}
        activeOpacity={0.85}
        onPress={() => setSelectedTypeId(type.id)}>
        {selected ? (
          <View style={styles.typeCheck}>
            <CheckIcon size={12} color={theme.colors.white} />
          </View>
        ) : null}
        <View style={[styles.typeIcon, selected && styles.typeIconSelected]}>
          <Icon
            size={22}
            color={selected ? theme.colors.white : '#374151'}
          />
        </View>
        <Text style={styles.typeLabel}>{type.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          {navigation.canGoBack() ? (
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}>
              <ChevronLeftIcon size={22} color="#181B1F" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          {cameFromSelection ? (
            <Text style={styles.stepText}>
              Step <Text style={styles.stepNum}>2</Text> of 2
            </Text>
          ) : (
            <Text style={styles.stepText}>Confirm &amp; start</Text>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Set up your shift</Text>
          <Text style={styles.subtitle}>
            {!cameFromSelection && singleShiftType
              ? 'You’re assigned to one program and one position. Confirm your time to begin.'
              : 'Confirm your position and start time to begin.'}
          </Text>

          <View
            style={[
              styles.programCard,
              {marginBottom: singleShiftType ? theme.spacing.md : theme.spacing.xxl},
            ]}>
            <View style={styles.programPin}>
              <MapPinIcon size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.programText}>
              <Text style={styles.programLabel}>
                {cameFromSelection ? 'PROGRAM · assigned by supervisor' : 'PROGRAM'}
              </Text>
              <Text style={styles.programName} numberOfLines={1}>
                {program?.name ?? '—'}
              </Text>
            </View>
            {cameFromSelection ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {singleShiftType ? (
            renderSingleShiftType(shiftTypes[0])
          ) : (
            <>
              <Text style={styles.sectionTitle}>Shift type</Text>
              <Text style={styles.sectionSubtitle}>
                Pick the position you're covering today.
              </Text>
              <View style={styles.typeGrid}>
                {shiftTypes.map(renderShiftType)}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Shift start time</Text>
          <Text style={styles.sectionSubtitle}>
            Auto-set to now — tap to adjust if you started earlier.
          </Text>

          <View style={styles.timeCard}>
            <TouchableOpacity
              style={styles.timeRow}
              activeOpacity={0.7}
              onPress={() => setPicker('start')}>
              <View style={styles.timeBadge}>
                <ClockIcon size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.timeText}>
                <Text style={styles.timeLabel}>STARTS AT</Text>
                <Text style={styles.timeValue}>{formatWhen(startTime)}</Text>
              </View>
              <ChevronRightIcon size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.timeDivider} />

            <TouchableOpacity
              style={styles.timeRow}
              activeOpacity={autoEnd ? 1 : 0.7}
              disabled={autoEnd}
              onPress={() => setPicker('stop')}>
              <View style={[styles.timeBadge, autoEnd && styles.timeBadgeMuted]}>
                <ClockIcon
                  size={20}
                  color={autoEnd ? theme.colors.textMuted : theme.colors.primary}
                />
              </View>
              <View style={styles.timeText}>
                <Text style={styles.timeLabel}>STOPS AT</Text>
                <Text
                  style={[styles.timeValue, autoEnd && styles.timeValueMuted]}>
                  {formatWhen(stopTime)}
                </Text>
              </View>
              {autoEnd ? null : (
                <ChevronRightIcon size={20} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TimePickerSheet
            visible={picker !== null}
            value={picker === 'stop' ? stopTime : startTime}
            title={picker === 'stop' ? 'Shift stop time' : 'Shift start time'}
            maximumDate={picker === 'start' ? new Date() : undefined}
            minimumDate={picker === 'stop' ? startTime : undefined}
            onConfirm={onConfirmTime}
            onCancel={() => setPicker(null)}
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.7}
            onPress={toggleAutoEnd}>
            <View style={[styles.checkbox, autoEnd && styles.checkboxOn]}>
              {autoEnd ? <CheckIcon size={14} color={theme.colors.white} /> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              Automatically end shift {SHIFT_HOURS} hours after start time
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <PrimaryButton
          label="Start Shift"
          onPress={handleStart}
          disabled={!selectedTypeId}
          leadingIcon={<PlayIcon size={16} color={theme.colors.white} />}
          style={styles.startBtn}
          labelStyle={styles.startText}
        />

        {!cameFromSelection ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't continue further.{' '}
              <Text style={styles.footerLink} onPress={() => dispatch(logout())}>
                Logout?
              </Text>
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  backBtnPlaceholder: {width: 40, height: 40},
  stepText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  stepNum: {fontFamily: theme.fonts.black, color: theme.colors.primary},
  scroll: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 26,
    lineHeight: 26,
    letterSpacing: -0.6,
    fontFamily: theme.fonts.black,
    color: '#181B1F',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: theme.fonts.bold,
    color: '#5B5F66',
    marginBottom: theme.spacing.lg,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadow.card,
  },
  programPin: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: '#EAF2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  programText: {flex: 1},
  programLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#8B9099',
    marginBottom: 3,
  },
  programName: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: '#20242A',
  },
  changeLink: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    lineHeight: 12.5,
    color: '#5C9B36',
    textDecorationLine: 'underline',
    marginLeft: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 19,
    lineHeight: 19,
    letterSpacing: -0.3,
    color: '#181B1F',
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 18.9,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  singleTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
    ...theme.shadow.card,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxl,
  },
  typeCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  typeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EAF2FB',
  },
  typeCheck: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  typeIconSelected: {backgroundColor: theme.colors.primary},
  typeLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: '#20242A',
  },
  timeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.card,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
  },
  timeBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: '#EAF2FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeMuted: {backgroundColor: '#F1F3F5'},
  timeDivider: {height: 1, backgroundColor: theme.colors.border},
  timeText: {flex: 1, marginLeft: theme.spacing.md},
  timeLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#8B9099',
    marginBottom: 3,
  },
  timeValue: {
    fontFamily: theme.fonts.black,
    fontSize: 17,
    lineHeight: 17,
    color: '#20242A',
  },
  timeValueMuted: {color: '#8B9099'},
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#C9CED6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 13.5,
    color: theme.colors.textDark,
  },
  startBtn: {
    marginHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
  },
  startText: {
    fontFamily: theme.fonts.black,
    fontSize: 17,
    letterSpacing: 0.2,
  },
  footer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {fontFamily: theme.fonts.black, color: theme.colors.textSecondary},
});

export default ShiftSetupScreen;
