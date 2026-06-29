import React from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch} from '../redux/store';
import {logout} from '../redux/auth/actions';
import {GetUser} from '../redux/selectors';
import {theme} from '../theme';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = GetUser();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout())},
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>⊙</Text>
          </View>
          <View style={theme.common.flex1}>
            <Text style={styles.userName}>{user?.name ?? '—'}</Text>
            <Text style={styles.userHandle}>@{user?.username ?? '—'}</Text>
            <Text style={styles.userId}>ID: {user?.id ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.signOutRow}>
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  pageHeader: {paddingHorizontal: theme.spacing.lg, paddingTop: 12, paddingBottom: 8},
  pageTitle: {fontSize: theme.fontSize.xl, fontFamily: theme.fonts.bold, color: '#111827'},
  content: {padding: theme.spacing.lg},
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarIcon: {fontSize: theme.fontSize.xl},
  userName: {fontSize: theme.fontSize.md, fontFamily: theme.fonts.bold, color: '#111827'},
  userHandle: {fontSize: theme.fontSize.sm, fontFamily: theme.fonts.regular, color: '#6B7280', marginTop: 2},
  userId: {fontSize: theme.fontSize.xs, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, marginTop: 4},
  signOutRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIcon: {fontSize: 18, marginRight: 12},
  signOutText: {flex: 1, fontSize: theme.fontSize.base, fontFamily: theme.fonts.medium, color: theme.colors.error},
  rowArrow: {fontSize: 18, color: theme.colors.textMuted},
});

export default ProfileScreen;
