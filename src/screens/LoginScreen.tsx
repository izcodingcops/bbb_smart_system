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
import {useAuth} from '../hooks/useAuth';
import LoadingOverlay from '../components/LoadingOverlay';
import {theme} from '../theme';

const LoginScreen: React.FC = () => {
  const {login, isLoading, error, dismissError} = useAuth();

  const [username, setUsername] = useState('0000waqas');
  const [password, setPassword] = useState('Test@!23');
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>BBB</Text>
          <Text style={styles.heroSubtitle}>SMART SYSTEM</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={[styles.input, fieldErrors.username ? styles.inputError : null]}
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
            {fieldErrors.username ? (
              <Text style={styles.fieldError}>{fieldErrors.username}</Text>
            ) : null}
          </View>

          <View style={[styles.fieldGroup, styles.lastFieldGroup]}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputError : null]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={v => {
                setPassword(v);
                if (fieldErrors.password) {
                  setFieldErrors(p => ({...p, password: ''}));
                }
              }}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}>
            <Text style={styles.submitText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Demo: johndoe / password123</Text>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Signing in…" />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  scroll: {flexGrow: 1},
  hero: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.xl + 4,
    paddingTop: 80,
    paddingBottom: 64,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: theme.fonts.black,
    color: theme.colors.white,
    letterSpacing: 6,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: theme.fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.fontSize.sm,
    letterSpacing: 3,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg + 4,
    marginTop: -28,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.xl + 4,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.bold,
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs + 2,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl + 4,
  },
  fieldGroup: {marginBottom: theme.spacing.md},
  lastFieldGroup: {marginBottom: theme.spacing.xl + 4},
  fieldLabel: {
    fontSize: theme.fontSize.xs + 2,
    fontFamily: theme.fonts.bold,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {borderColor: theme.colors.error},
  fieldError: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledBtn: {opacity: 0.6},
  submitText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
  },
  hint: {
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.lg + 4,
  },
});

export default LoginScreen;
