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
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Card, PrimaryButton, ScreenScaffold} from '../../components/ui';
import LoadingOverlay from '../../components/LoadingOverlay';
import {usePasswordReset} from '../../hooks/usePasswordReset';
import type {AuthStackParamList} from '../../navigation/AuthNavigator';
import {maskEmail} from '../../utils/text';
import {theme} from '../../theme';

const OTP_LENGTH = 6;
const CODE_TTL_MS = 15 * 60 * 1000;

const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
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
  // Track an absolute deadline rather than a countdown: one interval, and the
  // clock stays accurate if the JS thread is throttled or backgrounded.
  const [deadline, setDeadline] = useState(() => Date.now() + CODE_TTL_MS);
  const [now, setNow] = useState(Date.now());
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, deadline - now);

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
    setDeadline(Date.now() + CODE_TTL_MS);
    setNow(Date.now());
    inputs.current[0]?.focus();
    const res = await requestCode(email);
    if (res.status !== 200) {
      setError(res.message);
    }
  };

  const expired = remainingMs <= 0;

  return (
    <ScreenScaffold
      onBack={() => navigation.goBack()}
      title="Enter verification code"
      subtitle={
        <>
          We sent a 6-digit code to{' '}
          <Text style={styles.subtitleStrong}>{maskEmail(email)}</Text>. Enter it
          below to reset your password.
        </>
      }>
      <View style={styles.body}>
          <Card frosted>
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
                  {formatTime(remainingMs)}
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
          </Card>

          <PrimaryButton
            label="Verify & continue"
            onPress={handleVerify}
            disabled={isLoading || expired}
            style={styles.submit}
          />
      </View>

      <LoadingOverlay visible={isLoading} message="Verifying…" />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  body: {flex: 1, paddingHorizontal: theme.spacing.lg},
  subtitleStrong: {fontFamily: theme.fonts.black, color: theme.colors.primary},
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
  submit: {marginTop: theme.spacing.xxl},
});

export default VerifyOtpScreen;
