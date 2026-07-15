import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../components/ScreenBackground';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import CheckIcon from '../components/icons/CheckIcon';
import LoadingOverlay from '../components/LoadingOverlay';
import {usePasswordReset} from '../hooks/usePasswordReset';
import type {AuthStackParamList} from '../navigation/AuthNavigator';
import {theme} from '../theme';

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

  const passed = RULES.map(r => r.test(password));
  const allRulesPass = passed.every(Boolean);
  const matches = confirm.length > 0 && password === confirm;
  const canSubmit = allRulesPass && matches;

  const handleReset = async () => {
    if (!canSubmit) {
      return;
    }
    const res = await resetPassword(email, code, password);
    if (res.status === 200) {
      Alert.alert('Password reset', 'Your password has been reset. Please sign in.', [
        {text: 'OK', onPress: () => navigation.popToTop()},
      ]);
    } else {
      Alert.alert('Reset failed', res.message);
    }
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color="#181B1F" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Create new password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from any you've used before.
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.rules}>
                {RULES.map((rule, i) => (
                  <View key={rule.key} style={styles.ruleItem}>
                    <View
                      style={[styles.ruleDot, passed[i] && styles.ruleDotOn]}>
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

              <Text style={[styles.label, styles.confirmLabel]}>
                CONFIRM PASSWORD
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
              {confirm.length > 0 && !matches ? (
                <Text style={styles.errorText}>Passwords don't match.</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.disabledBtn]}
              activeOpacity={0.85}
              onPress={handleReset}
              disabled={!canSubmit || isLoading}>
              <Text
                style={[
                  styles.submitText,
                  !canSubmit && styles.disabledText,
                ]}>
                Reset password
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <LoadingOverlay visible={isLoading} message="Resetting…" />
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  topRow: {paddingHorizontal: theme.spacing.xxl, paddingTop: theme.spacing.sm},
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
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
    marginBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadow.card,
  },
  label: {
    fontSize: 12,
    lineHeight: 12,
    fontFamily: theme.fonts.black,
    color: theme.colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  confirmLabel: {marginTop: theme.spacing.lg},
  inputWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: '#1A1C1E',
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
  errorText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xxl,
    shadowColor: '#0066B2',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 8,
  },
  disabledBtn: {
    backgroundColor: '#DDE1E6',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
  },
  disabledText: {color: '#9AA0A6'},
});

export default CreateNewPasswordScreen;
