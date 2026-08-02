import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {SectionTitle, Skeleton} from '../../../components/ui';
import {
  ClipboardCheckIcon,
  ElevatorIcon,
  SprayCanIcon,
  TrashIcon,
} from '../../../components/icons';
import {QuickAction} from '../../../types/work';
import {theme} from '../../../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

const ICON_MAP: Record<string, IconComponent> = {
  graffiti: SprayCanIcon,
  elevator: ElevatorIcon,
  litter: TrashIcon,
  inspection: ClipboardCheckIcon,
};

const SKELETON_TILES = [0, 1, 2, 3];

interface Props {
  actions: QuickAction[];
  isLoading?: boolean;
  onSelect?: (action: QuickAction) => void;
}

const QuickActions: React.FC<Props> = ({actions, isLoading, onSelect}) => (
  <>
    <SectionTitle title="Quick Actions" style={styles.title} />
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {isLoading
        ? SKELETON_TILES.map(index => (
            <View key={index} style={styles.card}>
              <Skeleton width={40} height={40} radius={theme.radius.md} />
              <Skeleton width={70} height={13.5} style={styles.labelSkeleton} />
            </View>
          ))
        : actions.map(action => {
            const Icon = ICON_MAP[action.icon] ?? ClipboardCheckIcon;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => onSelect?.(action)}>
                <View style={[styles.icon, {backgroundColor: action.tint}]}>
                  <Icon size={20} color={action.iconColor} />
                </View>
                <Text style={styles.label}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
    </ScrollView>
  </>
);

const styles = StyleSheet.create({
  title: {marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md},
  row: {gap: theme.spacing.md, paddingRight: theme.spacing.md},
  card: {
    width: 128,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  label: {fontFamily: theme.fonts.black, fontSize: 13.5, color: '#181B1F'},
  labelSkeleton: {marginTop: theme.spacing.md},
});

export default QuickActions;
