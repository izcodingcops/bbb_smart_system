import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../theme';

interface MaintenanceHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  variant?: 'plain' | 'gradient';
  bordered?: boolean;
  align?: 'center' | 'start';
}

const MaintenanceHeader: React.FC<MaintenanceHeaderProps> = ({
  title,
  subtitle,
  left,
  right,
  variant = 'plain',
  bordered = false,
  align = 'center',
}) => (
  <View style={[styles.wrap, bordered && styles.bordered]}>
    {variant === 'gradient' && (
      <LinearGradient
        pointerEvents="none"
        colors={theme.gradients.maintenanceHeader}
        locations={[0.15, 0.85]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
    )}
    <SafeAreaView edges={['top']} style={[styles.row, align === 'start' && styles.rowStart]}>
      {align === 'center' ? (
        <>
          <View style={[styles.side, styles.sideLeft]}>{left}</View>
          <View style={styles.titleGroupCenter}>
            {typeof title === 'string' ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              title
            )}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={[styles.side, styles.sideRight]}>{right}</View>
        </>
      ) : (
        <>
          <View style={styles.titleGroupStart}>
            {typeof title === 'string' ? <Text style={styles.title}>{title}</Text> : title}
          </View>
          {right}
        </>
      )}
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  wrap: {overflow: 'hidden', backgroundColor: theme.colors.surface},
  bordered: {borderBottomWidth: 1, borderBottomColor: '#EEE'},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 4,
    paddingBottom: 12,
  },
  rowStart: {justifyContent: 'space-between'},
  side: {minWidth: 32},
  sideLeft: {alignItems: 'flex-start'},
  sideRight: {alignItems: 'flex-end'},
  titleGroupCenter: {flex: 1, alignItems: 'center'},
  titleGroupStart: {},
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.fontSize.xxl,
    letterSpacing: 0,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});

export default MaintenanceHeader;
