import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../hooks/useAuth';
import type {SetupStackParamList} from '../navigation/SetupNavigator';
import MapPinIcon from '../components/icons/MapPinIcon';
import CheckIcon from '../components/icons/CheckIcon';
import ArrowRightIcon from '../components/icons/ArrowRightIcon';
import {Program} from '../types/auth';
import {theme} from '../theme';

const ProgramSelectionScreen: React.FC = () => {
  const {programs, selectProgram, logout} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<SetupStackParamList>>();

  const [selectedId, setSelectedId] = useState<string>(programs[0]?.id ?? '');

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
          <Text style={styles.cardAddress} numberOfLines={1}>
            {program.address}
          </Text>
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

        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}>
          {programs.map(renderCard)}
        </ScrollView>

        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.85}
          onPress={handleNext}
          disabled={!selectedId}>
          <Text style={styles.nextText}>Next</Text>
          <ArrowRightIcon size={20} color={theme.colors.white} />
        </TouchableOpacity>

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
  cardAddress: {
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
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
    shadowColor: '#0066B2',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 8,
  },
  nextText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
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
