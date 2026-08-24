import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import {ConfirmDialog, PrimaryButton, TextField} from '../../components/ui';
import {CheckIcon, ChevronLeftIcon, EyeIcon, LockIcon, ShieldCheckIcon} from '../../components/icons';
import {useAppDispatch} from '../../redux/store';
import {logout} from '../../redux/auth/slice';
import {usePasswordReset} from '../../hooks/usePasswordReset';
import {theme} from '../../theme';

const RULES: [string, (v: string) => boolean][] = [
  ['At least 8 characters', v => v.length >= 8],
  ['One uppercase letter', v => /[A-Z]/.test(v)],
  ['One number', v => /[0-9]/.test(v)],
  ['One symbol (!@#$…)', v => /[^A-Za-z0-9]/.test(v)],
];
const passwordOk = (v: string) => RULES.every(([, check]) => check(v));

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {isLoading, changePassword} = usePasswordReset();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ready = passwordOk(next) && current.length > 0;

  const submit = async () => {
    setConfirmOpen(false);
    const outcome = await changePassword(current, next);
    if (outcome.ok) {
      dispatch(logout());
      return;
    }
    if (outcome.message === 'Current password is incorrect.') {
      const remaining = Math.max(0, attempts - 1);
      setAttempts(remaining);
      setError(`Current password is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your account locks.`);
      return;
    }
    setError(outcome.message);
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Change Password</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.note}>
            <ShieldCheckIcon size={18} color={theme.colors.primary} />
            <Text style={styles.noteText}>
              For your security you'll be signed out on this device once the password changes, then asked to sign in again.
            </Text>
          </View>

          <TextField
            label="Current Password"
            leadingIcon={<LockIcon size={17} color={theme.colors.textMuted} />}
            trailingIcon={
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)}>
                <EyeIcon size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            }
            placeholder="Enter your current password"
            secureTextEntry={!showCurrent}
            value={current}
            onChangeText={v => {
              setCurrent(v);
              setError(null);
            }}
            error={error ?? undefined}
            containerStyle={styles.field}
          />

          <TextField
            label="New Password"
            leadingIcon={<LockIcon size={17} color={theme.colors.textMuted} />}
            trailingIcon={
              <TouchableOpacity onPress={() => setShowNext(v => !v)}>
                <EyeIcon size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            }
            placeholder="Create a new password"
            secureTextEntry={!showNext}
            value={next}
            onChangeText={setNext}
            containerStyle={styles.field}
          />

          <View style={styles.rules}>
            {RULES.map(([label, check]) => {
              const ok = check(next);
              return (
                <View key={label} style={styles.ruleRow}>
                  <View style={[styles.ruleTick, ok && styles.ruleTickOn]}>
                    {ok ? <CheckIcon size={11} color={theme.colors.white} /> : null}
                  </View>
                  <Text style={[styles.ruleLabel, ok && styles.ruleLabelOn]}>{label}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.help}>
            Your new password can't match the current one and won't be reused for the next 5 changes.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Change Password"
            disabled={!ready || isLoading}
            onPress={() => setConfirmOpen(true)}
          />
        </View>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmOpen}
        title="Change password & sign out?"
        message="Your new password takes effect immediately. Smart System will sign you out on this device — any offline work stays saved and syncs after you sign back in."
        confirmLabel="Change & sign out"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submit}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
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
  note: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    marginBottom: theme.spacing.lg,
  },
  noteText: {flex: 1, fontFamily: theme.fonts.bold, fontSize: 12.5, color: theme.colors.primaryDark, lineHeight: 18},
  field: {marginBottom: theme.spacing.lg},
  rules: {marginTop: -theme.spacing.sm, marginBottom: theme.spacing.lg},
  ruleRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 6},
  ruleTick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleTickOn: {backgroundColor: theme.colors.success, borderColor: theme.colors.success},
  ruleLabel: {fontFamily: theme.fonts.bold, fontSize: 13, color: theme.colors.textMuted},
  ruleLabelOn: {color: theme.colors.text},
  help: {fontFamily: theme.fonts.regular, fontSize: 12.5, color: theme.colors.textMuted, lineHeight: 18},
  footer: {padding: theme.spacing.lg},
});

export default ChangePasswordScreen;
