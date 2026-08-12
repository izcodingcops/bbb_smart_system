import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeftIcon, EditIcon, TrashIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  title: string;
  /** Omitted on the loading and error branches, where no record is loaded. */
  reference?: string;
  onBack: () => void;
  /** Both omitted on loading and error, leaving a bare back button. */
  onEdit?: () => void;
  onDelete?: () => void;
}

const DetailTopBar: React.FC<Props> = ({
  title,
  reference,
  onBack,
  onEdit,
  onDelete,
}) => (
  <SafeAreaView edges={['top']} style={styles.bar}>
    <View style={styles.row}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={onBack}>
        <ChevronLeftIcon size={19} color="#3A3F46" />
      </TouchableOpacity>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {reference ? <Text style={styles.reference}>{reference}</Text> : null}
      </View>
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? (
            <TouchableOpacity style={styles.editButton} activeOpacity={0.85} onPress={onEdit}>
              <EditIcon size={16} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          ) : null}
          {onDelete ? (
            <TouchableOpacity style={styles.deleteButton} activeOpacity={0.85} onPress={onDelete}>
              <TrashIcon size={18} color="#CF1322" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  // Transparent so the screen gradient runs behind the bar — the design has no
  // white header band and no rule under it; the first hairline is the one below
  // the reference/Add-comment row.
  bar: {backgroundColor: 'transparent'},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.glassPill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    backgroundColor: theme.glass.buttonFill,
    ...theme.shadow.glassPill,
  },
  text: {flex: 1, minWidth: 0, paddingTop: 2},
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  reference: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  actions: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2},
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    backgroundColor: theme.glass.buttonFill,
    ...theme.shadow.glassPill,
  },
  editText: {fontFamily: theme.fonts.black, fontSize: 14, color: theme.colors.text},
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCCC7',
    backgroundColor: '#FFF2F0',
  },
});

export default DetailTopBar;
