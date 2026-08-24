import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import {ConfirmDialog, PrimaryButton, SingleSelectSheet, Toast} from '../../components/ui';
import type {SelectOption} from '../../components/ui';
import {CheckIcon, ChevronLeftIcon, ChevronRightIcon} from '../../components/icons';
import {useAppDispatch} from '../../redux/store';
import {GetNotificationSettings} from '../../redux/settings/selectors';
import {setNotificationSettings} from '../../redux/settings/slice';
import {NotificationSettings} from '../../types/settings';
import {theme} from '../../theme';

type BooleanField =
  | 'assigned'
  | 'completed'
  | 'unassigned'
  | 'dnd'
  | 'sound'
  | 'vibrate'
  | 'lockscreen'
  | 'push'
  | 'byEmail';

type ModuleField = keyof NotificationSettings['modules'];

type PickerField = 'allowNotification' | 'reminderTime' | 'dndFrom' | 'dndTo' | 'tone' | 'summary';

const PICKER_TITLES: Record<PickerField, string> = {
  allowNotification: 'Allow Notification',
  reminderTime: 'Default Reminder Time',
  dndFrom: "Don't Disturb from",
  dndTo: "Don't Disturb until",
  tone: 'Tone',
  summary: 'Summary Email',
};

const PICKER_OPTIONS: Record<PickerField, SelectOption[]> = {
  allowNotification: ['Everyday', 'Weekdays only', 'Weekends only', 'Only during my shift', 'Custom days'].map(
    v => ({value: v, label: v}),
  ),
  reminderTime: ['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM', '04:00 PM'].map(v => ({
    value: v,
    label: v,
  })),
  dndFrom: ['08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(v => ({value: v, label: v})),
  dndTo: ['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM'].map(v => ({value: v, label: v})),
  tone: ['System Setting', 'Chime', 'Ping', 'Radio Call', 'Silent'].map(v => ({value: v, label: v})),
  summary: ['Daily digest', 'Weekly digest', 'Off'].map(v => ({value: v, label: v})),
};

const MODULE_LABELS: Record<ModuleField, string> = {
  maintenance: 'Maintenance',
  incident: 'Incident',
  dispatch: 'Dispatch',
  shiftNotes: 'Shift Notes',
  equipment: 'Equipment',
};

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const saved = GetNotificationSettings();

  const [draft, setDraft] = useState<NotificationSettings>(saved);
  const [activePicker, setActivePicker] = useState<PickerField | null>(null);
  const [toast, setToast] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const toggle = (field: BooleanField) => setDraft(d => ({...d, [field]: !d[field]}));
  const toggleModule = (field: ModuleField) =>
    setDraft(d => ({...d, modules: {...d.modules, [field]: !d.modules[field]}}));

  const handleBack = () => {
    if (dirty) {
      setDiscardConfirmOpen(true);
      return;
    }
    navigation.goBack();
  };

  const handleSave = () => {
    dispatch(setNotificationSettings(draft));
    setToast(true);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={handleBack}>
            <ChevronLeftIcon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Notification Setting</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.masterRow}>
            <View style={styles.flex1}>
              <Text style={styles.masterTitle}>Notifications</Text>
              <Text style={styles.masterSubtitle}>Get notifications from this app.</Text>
            </View>
            <ToggleSwitch on={draft.master} onPress={() => setDraft(d => ({...d, master: !d.master}))} />
          </View>

          <Section title="What to notify you about">
            <ToggleRow label="Assigned Task" on={draft.assigned} onPress={() => toggle('assigned')} />
            <ToggleRow
              label="Completed Task by you & someone"
              on={draft.completed}
              onPress={() => toggle('completed')}
            />
            <ToggleRow label="Unassigned Task" on={draft.unassigned} onPress={() => toggle('unassigned')} />
          </Section>

          <Section title="Notification Schedule">
            <PickerRow
              label="Allow Notification"
              value={draft.allowNotification}
              onPress={() => setActivePicker('allowNotification')}
            />
            <PickerRow
              label="Default Reminder Time"
              value={draft.reminderTime}
              onPress={() => setActivePicker('reminderTime')}
            />
            <ToggleRow label="Don't Disturb" on={draft.dnd} onPress={() => toggle('dnd')} />
            {draft.dnd ? (
              <View style={styles.dndRow}>
                <PickerRow label="From" value={draft.dndFrom} onPress={() => setActivePicker('dndFrom')} compact />
                <PickerRow label="Until" value={draft.dndTo} onPress={() => setActivePicker('dndTo')} compact />
              </View>
            ) : null}
          </Section>

          <Section title="How notifications display on phone">
            <ToggleRow label="Allow notification to play sound" on={draft.sound} onPress={() => toggle('sound')} />
            <ToggleRow label="Vibrate on alerts" on={draft.vibrate} onPress={() => toggle('vibrate')} />
            <ToggleRow
              label="Show notification on lock screen"
              on={draft.lockscreen}
              onPress={() => toggle('lockscreen')}
            />
            <ToggleRow label="Receive push notifications" on={draft.push} onPress={() => toggle('push')} />
            <ToggleRow
              label="Receive notifications by email"
              on={draft.byEmail}
              onPress={() => toggle('byEmail')}
            />
          </Section>

          <Section title="Modules to notify me about">
            {(Object.keys(MODULE_LABELS) as ModuleField[]).map(field => (
              <ToggleRow
                key={field}
                label={MODULE_LABELS[field]}
                on={draft.modules[field]}
                onPress={() => toggleModule(field)}
              />
            ))}
          </Section>

          <Section title="Sound & Appearance">
            <PickerRow label="Tone" value={draft.tone} onPress={() => setActivePicker('tone')} />
          </Section>

          <Section title="Email Summary">
            <PickerRow
              label="Send me a recap of my work"
              value={draft.summary}
              onPress={() => setActivePicker('summary')}
            />
          </Section>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Save Changes" onPress={handleSave} />
        </View>
      </SafeAreaView>

      {activePicker ? (
        <SingleSelectSheet
          visible
          title={PICKER_TITLES[activePicker]}
          options={PICKER_OPTIONS[activePicker]}
          value={draft[activePicker]}
          onChange={v => setDraft(d => ({...d, [activePicker]: v} as NotificationSettings))}
          onClose={() => setActivePicker(null)}
        />
      ) : null}

      <ConfirmDialog
        visible={discardConfirmOpen}
        title="Discard changes?"
        message="You have unsaved notification settings. Leaving now discards them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        confirmTone="danger"
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          navigation.goBack();
        }}
      />

      <Toast
        visible={toast}
        title="Notification settings saved"
        message="Your alert preferences are applied across Smart System."
        onDismiss={() => setToast(false)}
      />
    </ScreenBackground>
  );
};

const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const ToggleRow: React.FC<{label: string; on: boolean; onPress: () => void}> = ({label, on, onPress}) => (
  <TouchableOpacity style={styles.toggleRow} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.checkbox, on && styles.checkboxOn]}>
      {on ? <CheckIcon size={12} color={theme.colors.white} /> : null}
    </View>
    <Text style={styles.toggleLabel}>{label}</Text>
  </TouchableOpacity>
);

const ToggleSwitch: React.FC<{on: boolean; onPress: () => void}> = ({on, onPress}) => (
  <TouchableOpacity
    style={[styles.switchTrack, on && styles.switchTrackOn]}
    activeOpacity={0.8}
    onPress={onPress}>
    <View style={[styles.switchKnob, on && styles.switchKnobOn]} />
  </TouchableOpacity>
);

const PickerRow: React.FC<{label: string; value: string; onPress: () => void; compact?: boolean}> = ({
  label,
  value,
  onPress,
  compact,
}) => (
  <View style={compact ? styles.pickerCompactWrap : styles.pickerWrap}>
    <Text style={styles.pickerLabel}>{label}</Text>
    <TouchableOpacity style={styles.pickerField} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.pickerValue} numberOfLines={1}>
        {value}
      </Text>
      <ChevronRightIcon size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  flex1: {flex: 1},
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  topbarTitle: {fontFamily: theme.fonts.black, fontSize: theme.fontSize.lg, color: theme.colors.text},
  scroll: {padding: theme.spacing.lg, paddingBottom: 40},
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.card,
  },
  masterTitle: {fontFamily: theme.fonts.black, fontSize: 15, color: theme.colors.text},
  masterSubtitle: {fontFamily: theme.fonts.regular, fontSize: 12.5, color: theme.colors.textMuted, marginTop: 2},
  section: {marginBottom: theme.spacing.xl},
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  toggleRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: 9},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
  toggleLabel: {flex: 1, fontFamily: theme.fonts.bold, fontSize: 14, color: theme.colors.text},
  switchTrack: {
    width: 46,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#DDE1E6',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {backgroundColor: theme.colors.primary},
  switchKnob: {width: 23, height: 23, borderRadius: 12, backgroundColor: theme.colors.white},
  switchKnobOn: {marginLeft: 19},
  pickerWrap: {marginBottom: theme.spacing.md},
  pickerCompactWrap: {flex: 1, marginBottom: theme.spacing.md},
  pickerLabel: {fontFamily: theme.fonts.bold, fontSize: 12.5, color: theme.colors.textMuted, marginBottom: 6},
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: '#F4F5F7',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  pickerValue: {flex: 1, fontFamily: theme.fonts.bold, fontSize: 14, color: theme.colors.text},
  dndRow: {flexDirection: 'row', gap: theme.spacing.md},
  footer: {padding: theme.spacing.lg},
});

export default NotificationSettingsScreen;
