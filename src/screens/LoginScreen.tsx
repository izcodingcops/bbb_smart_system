import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import LoadingOverlay from '../components/LoadingOverlay';
import UserIcon from '../components/icons/UserIcon';
import LockIcon from '../components/icons/LockIcon';
import EyeIcon from '../components/icons/EyeIcon';
import ArrowRightIcon from '../components/icons/ArrowRightIcon';
import GlobeIcon from '../components/icons/GlobeIcon';
import {theme} from '../theme';

const LoginScreen: React.FC = () => {
  const {login, isLoading, error, dismissError} = useAuth();

  const [username, setUsername] = useState('0000waqas');
  const [password, setPassword] = useState('Test@!23');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({username: '', password: ''});

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [{text: 'OK', onPress: dismissError}]);
    }
  }, [error, dismissError]);

  const validate = (): boolean => {
    const errs = {username: '', password: ''};
    if (!username.trim()) {
      errs.username = 'Username is required.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(errs);
    return !errs.username && !errs.password;
  };

  const handleLogin = () => {
    if (validate()) {
      login({username: username.trim(), password, login_type: 2});
    }
  };

  return (
    <LinearGradient
      colors={['#DCE9F5', '#EAF1F0', '#E4EFDD']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <View style={styles.langRow}>
              <TouchableOpacity style={styles.langPill} activeOpacity={0.8}>
                <GlobeIcon size={16} color="#374151" />
                <Text style={styles.langText}>English</Text>
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>EN</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.center}>
              <View style={styles.header}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Sign in to start your shift and manage your work in the field.
                </Text>
              </View>

              <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>USERNAME OR EMAIL</Text>
              <View
                style={[
                  styles.inputWrap,
                  fieldErrors.username ? styles.inputError : null,
                ]}>
                <UserIcon size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={v => {
                    setUsername(v);
                    if (fieldErrors.username) {
                      setFieldErrors(p => ({...p, username: ''}));
                    }
                  }}
                />
              </View>
              {fieldErrors.username ? (
                <Text style={styles.fieldError}>{fieldErrors.username}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrap,
                  fieldErrors.password ? styles.inputError : null,
                ]}>
                <LockIcon size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={v => {
                    setPassword(v);
                    if (fieldErrors.password) {
                      setFieldErrors(p => ({...p, password: ''}));
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(s => !s)}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <EyeIcon
                    size={20}
                    color={theme.colors.textMuted}
                    off={showPassword}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

              <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}>
              <Text style={styles.submitText}>Log in</Text>
              <ArrowRightIcon size={20} color={theme.colors.white} />
            </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Trouble signing in? Contact your{' '}
                <Text style={styles.footerBold}>management</Text>.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LoadingOverlay visible={isLoading} message="Signing in…" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  center: {flex: 1, justifyContent: 'center'},
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    ...theme.shadow.card,
  },
  langText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.sm,
    color: '#374151',
    marginHorizontal: 8,
  },
  langBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.white,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl + 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 28,
    letterSpacing: -0.6,
    fontFamily: theme.fonts.black,
    color: '#181B1F',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: theme.fonts.bold,
    color: '#5B5F66',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadow.card,
  },
  fieldGroup: {marginBottom: theme.spacing.lg},
  fieldLabel: {
    fontSize: 12,
    lineHeight: 12,
    fontFamily: theme.fonts.black,
    color: '#5B5F66',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: theme.fonts.bold,
    color: '#1A1C1E',
  },
  inputError: {borderColor: theme.colors.error},
  fieldError: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  forgotBtn: {alignSelf: 'flex-end', marginTop: theme.spacing.xs},
  forgotText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    lineHeight: 13.5,
    textAlign: 'right',
    color: theme.colors.primary,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    gap: 9,
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
  footer: {
    paddingTop: theme.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  footerBold: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});

export default LoginScreen;
