import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {PrimaryButton} from '../../components/ui';
import {useAuth} from '../../hooks/useAuth';
import type {SetupStackParamList} from '../../navigation/SetupNavigator';
import MapPinIcon from '../../components/icons/MapPinIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import {Program} from '../../types/shift';
import {theme} from '../../theme';

// Show the search field once the assigned list gets long enough to scan.
const SEARCH_THRESHOLD = 6;

const ProgramSelectionScreen: React.FC = () => {
  const {programs, selectProgram, logout} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<SetupStackParamList>>();

  const [selectedId, setSelectedId] = useState<string>(programs[0]?.id ?? '');
  const [query, setQuery] = useState('');

  const showSearch = programs.length > SEARCH_THRESHOLD;
  const q = query.trim().toLowerCase();
  const visiblePrograms =
    showSearch && q
      ? programs.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q),
        )
      : programs;

  const handleNext = () => {
    if (selectedId) {
      selectProgram(selectedId);
      navigation.navigate('ShiftSetup');
    }
  };

  const renderCard = (program: Program) => {
    const selected = program.id === selectedId;
    return (
      <TouchableOpacity
        key={program.id}
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={0.85}
        onPress={() => setSelectedId(program.id)}>
        <View style={[styles.pinBadge, selected && styles.pinBadgeSelected]}>
          <MapPinIcon
            size={22}
            color={selected ? theme.colors.white : theme.colors.primary}
          />
        </View>

        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={1}>
            {program.name}
          </Text>
          <View style={styles.cardAddressRow}>
            <MapPinIcon size={13} color="#5B5F66" />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {program.address}
            </Text>
          </View>
        </View>

        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <CheckIcon size={14} color={theme.colors.white} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.stepRow}>
          <Text style={styles.stepText}>
            Step <Text style={styles.stepNum}>1</Text> of 2
          </Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Select your program</Text>
          <Text style={styles.subtitle}>
            You're assigned to{' '}
            <Text style={styles.subtitleStrong}>
              {programs.length} programs
            </Text>
            . Choose the one you're working today.
          </Text>
        </View>

        {showSearch ? (
          <View style={styles.searchWrap}>
            <SearchIcon size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search programs"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {visiblePrograms.length ? (
            visiblePrograms.map(renderCard)
          ) : (
            <Text style={styles.emptyText}>No programs match “{query}”.</Text>
          )}
        </ScrollView>

        <PrimaryButton
          label="Next"
          onPress={handleNext}
          disabled={!selectedId}
          trailingIcon={<ArrowRightIcon size={20} color={theme.colors.white} />}
          style={styles.nextBtn}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't continue further.{' '}
            <Text style={styles.footerLink} onPress={() => logout()}>
              Logout?
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  stepRow: {
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
  },
  stepText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  stepNum: {fontFamily: theme.fonts.black, color: theme.colors.primary},
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#20242A',
  },
  emptyText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
  },
  subtitleStrong: {
    fontFamily: theme.fonts.black,
    fontSize: 14.5,
    lineHeight: 21,
    color: theme.colors.primary,
  },
  list: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadow.card,
  },
  cardSelected: {
    borderColor: 'rgba(0,102,178,0.4)',
    backgroundColor: '#E6F4FF',
  },
  pinBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: '#EAF2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  pinBadgeSelected: {backgroundColor: theme.colors.primary},
  cardText: {flex: 1},
  cardName: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: '#20242A',
    marginBottom: 3,
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardAddress: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 12.5,
    color: '#5B5F66',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: '#C9CED6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  radioSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  nextBtn: {
    marginHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
  },
  footer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {fontFamily: theme.fonts.black, color: theme.colors.textSecondary},
});

export default ProgramSelectionScreen;
