import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Card,
  PrimaryButton,
  ScreenScaffold,
  TextField,
} from '../../components/ui';
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  LockIcon,
} from '../../components/icons';
import LoadingOverlay from '../../components/LoadingOverlay';
import {usePasswordReset} from '../../hooks/usePasswordReset';
import type {AuthStackParamList} from '../../navigation/AuthNavigator';
import {theme} from '../../theme';

const RULES: Array<{key: string; label: string; test: (v: string) => boolean}> = [
  {key: 'len', label: 'At least 8 characters', test: v => v.length >= 8},
  {key: 'upper', label: 'One uppercase letter', test: v => /[A-Z]/.test(v)},
  {key: 'lower', label: 'One lowercase letter', test: v => /[a-z]/.test(v)},
  {key: 'num', label: 'One number', test: v => /[0-9]/.test(v)},
];

const CreateNewPasswordScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {params} = useRoute<RouteProp<AuthStackParamList, 'CreateNewPassword'>>();
  const {email, code} = params;
  const {isLoading, resetPassword} = usePasswordReset();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const passed = RULES.map(r => r.test(password));
  const allRulesPass = passed.every(Boolean);
  const matches = confirm.length > 0 && password === confirm;
  const canSubmit = allRulesPass && matches;

  const renderEyeToggle = (shown: boolean, toggle: () => void) => (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      <EyeIcon size={20} color={theme.colors.textMuted} off={shown} />
    </TouchableOpacity>
  );

  const handleReset = async () => {
    if (!canSubmit) {
      return;
    }
    const res = await resetPassword(email, code, password);
    if (res.status === 200) {
      Alert.alert(
        'Password reset',
        'Your password has been reset. Please sign in.',
        [{text: 'OK', onPress: () => navigation.popToTop()}],
      );
    } else {
      setServerError(res.message);
    }
  };

  return (
    <ScreenScaffold
      onBack={() => navigation.goBack()}
      icon={<LockIcon size={28} color={theme.colors.primary} />}
      title="Create new password"
      subtitle="Your new password must be different from any you've used before.">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Card frosted>
            <TextField
              label="New password"
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              trailingIcon={renderEyeToggle(showPassword, () =>
                setShowPassword(s => !s),
              )}
              onChangeText={v => {
                setPassword(v);
                if (serverError) {
                  setServerError('');
                }
              }}
            />

            <View style={styles.rules}>
              {RULES.map((rule, i) => (
                <View key={rule.key} style={styles.ruleItem}>
                  <View style={[styles.ruleDot, passed[i] && styles.ruleDotOn]}>
                    {passed[i] ? (
                      <CheckIcon size={11} color={theme.colors.white} />
                    ) : null}
                  </View>
                  <Text
                    style={[styles.ruleText, passed[i] && styles.ruleTextOn]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>

            <TextField
              label="Confirm password"
              placeholder="Re-enter new password"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              value={confirm}
              trailingIcon={renderEyeToggle(showConfirm, () =>
                setShowConfirm(s => !s),
              )}
              containerStyle={styles.confirm}
              error={
                confirm.length > 0 && !matches
                  ? "Passwords don't match."
                  : serverError || undefined
              }
              onChangeText={setConfirm}
            />
          </Card>

          <PrimaryButton
            label="Reset password"
            onPress={handleReset}
            disabled={!canSubmit || isLoading}
            trailingIcon={
              <ArrowRightIcon
                size={20}
                color={canSubmit && !isLoading ? theme.colors.white : '#9AA0A6'}
              />
            }
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Resetting…" />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  rules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  ruleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.6,
    borderColor: '#C9CED6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  ruleDotOn: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  ruleText: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  ruleTextOn: {color: theme.colors.textDark},
  confirm: {marginTop: theme.spacing.lg},
  submit: {marginTop: theme.spacing.xxl},
});

export default CreateNewPasswordScreen;
