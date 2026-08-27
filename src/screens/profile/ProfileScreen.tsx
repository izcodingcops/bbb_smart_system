import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
import {BottomSheet, ConfirmDialog, PersonChip, SingleSelectSheet, Toast} from '../../components/ui';
import {
  BellIcon,
  CameraIcon,
  EditIcon,
  FileTextIcon,
  GlobeIcon,
  HomeIcon,
  ImageIcon,
  InfoIcon,
  LockIcon,
  LogOutIcon,
  UserIcon,
} from '../../components/icons';
import ProfileRow from './components/ProfileRow';
import ProfileSectionCard from './components/ProfileSectionCard';
import {useAppDispatch} from '../../redux/store';
import {GetUser} from '../../redux/selectors';
import {GetLanguage} from '../../redux/settings/selectors';
import {setLanguage} from '../../redux/settings/slice';
import {logout} from '../../redux/auth/slice';
import {AppLanguage} from '../../types/settings';
import {ProfileStackParamList} from './routes';
import {theme} from '../../theme';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

const LANGUAGE_OPTIONS: {value: AppLanguage; label: string}[] = [
  {value: 'English', label: 'English'},
  {value: 'Spanish', label: 'Spanish'},
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const user = GetUser();
  const language = GetLanguage();

  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{title: string; message: string} | null>(null);

  const handlePickPhoto = (source: 'camera' | 'gallery') => {
    setAvatarSheetOpen(false);
    setToast({
      title: 'Profile photo updated',
      message:
        source === 'camera'
          ? 'Your new photo was taken from the camera.'
          : 'Your new photo was taken from your gallery.',
    });
  };

  const handleSetLanguage = (value: string) => {
    dispatch(setLanguage(value as AppLanguage));
    setToast({title: 'Language updated', message: `The app now displays in ${value}.`});
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              {user?.avatar ? (
                <Image source={{uri: user.avatar}} style={styles.avatarImg} />
              ) : (
                <PersonChip name={user?.name ?? '?'} size={88} shape="rounded" avatarOnly />
              )}
              <TouchableOpacity
                style={styles.avatarEdit}
                activeOpacity={0.8}
                onPress={() => setAvatarSheetOpen(true)}>
                <EditIcon size={14} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{user?.name ?? ''}</Text>
            {user?.role ? <Text style={styles.role}>{capitalize(user.role)}</Text> : null}
          </View>

          <ProfileSectionCard title="Account">
            <ProfileRow Icon={UserIcon} label="Profile Information" />
            <ProfileRow
              Icon={LockIcon}
              label="Change Password"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <ProfileRow
              Icon={GlobeIcon}
              label="Language & Region"
              value={language}
              onPress={() => setLanguageSheetOpen(true)}
            />
          </ProfileSectionCard>

          <ProfileSectionCard title="Setting">
            <ProfileRow
              Icon={BellIcon}
              label="Notification Setting"
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <ProfileRow Icon={HomeIcon} label="Customize Home" />
          </ProfileSectionCard>

          <ProfileSectionCard title="General">
            <ProfileRow Icon={InfoIcon} label="Help Center" />
            <ProfileRow Icon={FileTextIcon} label="Term & Policy" />
          </ProfileSectionCard>

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={() => setLogoutConfirmOpen(true)}>
            <LogOutIcon size={18} color={theme.colors.error} />
            <Text style={styles.logoutLabel}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <BottomSheet
        visible={avatarSheetOpen}
        title="Profile Photo"
        onClose={() => setAvatarSheetOpen(false)}>
        <TouchableOpacity
          style={styles.pickRow}
          activeOpacity={0.7}
          onPress={() => handlePickPhoto('camera')}>
          <CameraIcon size={20} color={theme.colors.primary} />
          <View style={styles.pickText}>
            <Text style={styles.pickTitle}>Take a Photo</Text>
            <Text style={styles.pickSubtitle}>Use the camera to capture a new one</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pickRow}
          activeOpacity={0.7}
          onPress={() => handlePickPhoto('gallery')}>
          <ImageIcon size={20} color={theme.colors.primary} />
          <View style={styles.pickText}>
            <Text style={styles.pickTitle}>Choose from Gallery</Text>
            <Text style={styles.pickSubtitle}>Pick an existing photo from your device</Text>
          </View>
        </TouchableOpacity>
      </BottomSheet>

      <SingleSelectSheet
        visible={languageSheetOpen}
        title="Language & Region"
        options={LANGUAGE_OPTIONS}
        value={language}
        onChange={handleSetLanguage}
        onClose={() => setLanguageSheetOpen(false)}
      />

      <ConfirmDialog
        visible={logoutConfirmOpen}
        title="Log out of Smart System?"
        message="Any work saved offline stays on this device and syncs the next time you sign in."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          dispatch(logout());
        }}
      />

      <Toast
        visible={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        onDismiss={() => setToast(null)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  scroll: {padding: theme.spacing.lg, paddingBottom: 40},
  hero: {alignItems: 'center', marginBottom: theme.spacing.xxl},
  avatarWrap: {width: 88, height: 88, position: 'relative'},
  avatarImg: {width: 88, height: 88, borderRadius: 26},
  avatarEdit: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  name: {
    fontFamily: theme.fonts.black,
    fontSize: theme.fontSize.xl,
    color: theme.colors.textOnGlass,
    marginTop: theme.spacing.md,
  },
  role: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textOnGlassMuted,
    marginTop: theme.spacing.xs,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    marginTop: theme.spacing.md,
  },
  logoutLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    color: theme.colors.error,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 14,
  },
  pickText: {flex: 1},
  pickTitle: {fontFamily: theme.fonts.bold, fontSize: 15, color: theme.colors.textOnGlass},
  pickSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 12.5,
    color: theme.colors.textOnGlassMuted,
    marginTop: 2,
  },
});

export default ProfileScreen;
