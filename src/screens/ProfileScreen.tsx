import React from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch} from '../redux/store';
import {logout} from '../redux/auth/actions';
import {GetUser} from '../redux/selectors';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = GetUser();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <View style={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8}}>
        <Text style={{fontSize: 22, fontWeight: '700', color: '#111827'}}>
          Profile
        </Text>
      </View>

      <View style={{padding: 16}}>
        {/* User info card */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#EFF6FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
            <Text style={{fontSize: 22}}>⊙</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 16, fontWeight: '600', color: '#111827'}}>
              {user?.name ?? '—'}
            </Text>
            <Text style={{fontSize: 13, color: '#6B7280', marginTop: 2}}>
              @{user?.username ?? '—'}
            </Text>
            <Text style={{fontSize: 12, color: '#9CA3AF', marginTop: 4}}>
              ID: {user?.id ?? '—'}
            </Text>
          </View>
        </View>

        {/* Sign out button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 18, marginRight: 12}}>🚪</Text>
          <Text style={{flex: 1, fontSize: 15, fontWeight: '500', color: '#EF4444'}}>
            Sign Out
          </Text>
          <Text style={{fontSize: 18, color: '#9CA3AF'}}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
