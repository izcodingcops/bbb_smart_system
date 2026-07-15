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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../components/ScreenBackground';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import LoadingOverlay from '../components/LoadingOverlay';
import {usePasswordReset} from '../hooks/usePasswordReset';
import type {AuthStackParamList} from '../navigation/AuthNavigator';
import {theme} from '../theme';

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
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter the email linked to your account and we'll send you a 6-digit
              verification code.
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrap, error ? styles.inputError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={v => {
                    setEmail(v);
                    if (error) {
                      setError('');
                    }
                  }}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.disabledBtn]}
              activeOpacity={0.85}
              onPress={handleSend}
              disabled={isLoading}>
              <Text style={styles.submitText}>Send verification code</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <LoadingOverlay visible={isLoading} message="Sending code…" />
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  topRow: {
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
    lineHeight: 16,
    fontFamily: theme.fonts.bold,
    color: '#1A1C1E',
    textAlign: 'center',
  },
  inputError: {borderColor: theme.colors.error},
  errorText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
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
  disabledBtn: {opacity: 0.6},
  submitText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
  },
});

export default ForgotPasswordScreen;
