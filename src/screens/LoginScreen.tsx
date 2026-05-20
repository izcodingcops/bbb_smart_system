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
} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import LoadingOverlay from '../components/LoadingOverlay';

const LoginScreen: React.FC = () => {
  const {login, isLoading, error, dismissError} = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled">

        <View className="bg-primary px-6 pt-20 pb-16 items-center">
          <Text className="text-4xl font-extrabold text-white tracking-widest mb-1">
            BBB
          </Text>
          <Text className="text-white/60 text-sm tracking-wider">
            SMART SYSTEM
          </Text>
        </View>

        <View className="bg-white mx-5 -mt-7 rounded-2xl px-6 py-8 shadow-md">
          <Text className="text-xl font-bold text-gray-900 mb-1">
            Welcome back
          </Text>
          <Text className="text-sm text-gray-400 mb-6">
            Sign in to your account
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Username
            </Text>
            <TextInput
              className={`border ${fieldErrors.username ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50`}
              placeholder="Enter your username"
              placeholderTextColor="#9CA3AF"
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
              <Text className="text-red-500 text-xs mt-1">
                {fieldErrors.username}
              </Text>
            ) : null}
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Password
            </Text>
            <TextInput
              className={`border ${fieldErrors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50`}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
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
              <Text className="text-red-500 text-xs mt-1">
                {fieldErrors.password}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            className={`bg-primary rounded-xl py-4 items-center ${isLoading ? 'opacity-60' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}>
            <Text className="text-white font-bold text-base">Sign In</Text>
          </TouchableOpacity>

          <Text className="text-center text-xs text-gray-400 mt-5">
            Demo: johndoe / password123
          </Text>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Signing in…" />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
