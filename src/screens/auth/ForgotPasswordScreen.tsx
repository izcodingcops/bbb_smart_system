import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Card,
  PrimaryButton,
  ScreenScaffold,
  TextField,
} from '../../components/ui';
import {ArrowRightIcon, MailIcon} from '../../components/icons';
import LoadingOverlay from '../../components/LoadingOverlay';
import {usePasswordReset} from '../../hooks/usePasswordReset';
import type {AuthStackParamList} from '../../navigation/AuthNavigator';
import {theme} from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {isLoading, requestCode} = usePasswordReset();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    const res = await requestCode(value);
    if (res.status === 200) {
      navigation.navigate('VerifyOtp', {email: value});
    } else {
      setError(res.message);
    }
  };

  return (
    <ScreenScaffold
      onBack={() => navigation.goBack()}
      icon={<MailIcon size={28} color={theme.colors.primary} />}
      title="Forgot password?"
      subtitle="Enter the email linked to your account and we'll send you a 6-digit verification code.">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Card frosted>
            <TextField
              label="Email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              centered
              value={email}
              error={error}
              onChangeText={v => {
                setEmail(v);
                if (error) {
                  setError('');
                }
              }}
            />
          </Card>

          <PrimaryButton
            label="Send verification code"
            onPress={handleSend}
            disabled={isLoading}
            trailingIcon={
              <ArrowRightIcon size={20} color={theme.colors.white} />
            }
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Sending code…" />
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
  submit: {marginTop: theme.spacing.xxl},
});

export default ForgotPasswordScreen;
