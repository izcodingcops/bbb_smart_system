import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../components/ScreenBackground';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import LoadingOverlay from '../components/LoadingOverlay';
import {usePasswordReset} from '../hooks/usePasswordReset';
import type {AuthStackParamList} from '../navigation/AuthNavigator';
import {theme} from '../theme';

const OTP_LENGTH = 6;
const CODE_TTL = 15 * 60; // seconds

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  const masked =
    local.length <= 2
      ? local
      : `${local[0]}●●●${local[local.length - 1]}`;
  return `${masked}@${domain}`;
};

const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VerifyOtpScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {params} = useRoute<RouteProp<AuthStackParamList, 'VerifyOtp'>>();
  const {email} = params;
  const {isLoading, verifyCode, requestCode} = usePasswordReset();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const setDigit = (index: number, value: string) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (error) {
      setError('');
    }
    if (char && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    } else if (char && index === OTP_LENGTH - 1) {
      // Last digit entered — drop the number-pad (and its "Done" accessory).
      Keyboard.dismiss();
    }
  };

  const onKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }
    const res = await verifyCode(email, code);
    if (res.status === 200) {
      navigation.navigate('CreateNewPassword', {email, code});
    } else {
      setError(res.message);
    }
  };

  const handleResend = async () => {
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    setSecondsLeft(CODE_TTL);
    inputs.current[0]?.focus();
    await requestCode(email);
  };

  const expired = secondsLeft <= 0;

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

        <View style={styles.body}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.subtitleStrong}>{maskEmail(email)}</Text>. Enter
            it below to reset your password.
          </Text>

          <View style={styles.card}>
            <View style={styles.otpRow}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={ref => {
                    inputs.current[i] = ref;
                  }}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    error ? styles.otpBoxError : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={v => setDigit(i, v)}
                  onKeyPress={e => onKeyPress(i, e)}
                  returnKeyType="done"
                  autoFocus={i === 0}
                />
              ))}
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.validityText}>
                Code is valid for{' '}
                <Text style={styles.validityTime}>
                  {formatTime(secondsLeft)}
                </Text>{' '}
                min
              </Text>
            )}

            <View style={styles.divider} />

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (isLoading || expired) && styles.disabledBtn,
            ]}
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={isLoading || expired}>
            <Text style={styles.submitText}>Verify &amp; continue</Text>
          </TouchableOpacity>
        </View>

        <LoadingOverlay visible={isLoading} message="Verifying…" />
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
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
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
  subtitleStrong: {fontFamily: theme.fonts.black, color: theme.colors.primary},
  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadow.card,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: theme.fonts.black,
    color: theme.colors.primary,
  },
  otpBoxFilled: {borderColor: 'rgba(0,102,178,0.4)'},
  otpBoxError: {borderColor: theme.colors.error, color: theme.colors.error},
  validityText: {
    textAlign: 'center',
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  validityTime: {fontFamily: theme.fonts.black, color: theme.colors.primary},
  errorText: {
    textAlign: 'center',
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.error,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  resendLink: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
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

export default VerifyOtpScreen;
