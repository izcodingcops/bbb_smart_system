import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {FieldLabel} from './DropdownField';
import {UploadIcon, XIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  /** Omitted in compact mode, which has no room for a label above it. */
  label?: string;
  /** Local file URIs. */
  uris: string[];
  onChange: (uris: string[]) => void;
  title?: string;
  subtitle?: string;
  /**
   * The design's `.uplmini`: one 44px dashed row instead of the stacked
   * dropzone, with no label and no subtitle. For places that repeat an
   * uploader often enough that the full dropzone would dominate the screen —
   * the Off Hours checklist attaches images to every question.
   */
  compact?: boolean;
}

/**
 * Gallery-only: the design also offers a file browser, which would need a
 * document-picker native module we don't ship.
 */
const UploadField: React.FC<Props> = ({
  label,
  uris,
  onChange,
  title = 'Upload document',
  subtitle = 'PNG or JPG · up to 10 MB',
  compact = false,
}) => {
  const pick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(
        "Couldn't open your photos",
        result.errorMessage ?? 'Try again.',
      );
      return;
    }
    const picked = (result.assets ?? [])
      .map(asset => asset.uri)
      .filter((uri): uri is string => !!uri);
    onChange([...uris, ...picked]);
  };

  return (
    <View style={compact ? styles.fieldCompact : styles.field}>
      {label && !compact ? <FieldLabel label={label} /> : null}
      {compact ? (
        <TouchableOpacity
          style={styles.dropzoneCompact}
          activeOpacity={0.85}
          onPress={pick}>
          <UploadIcon size={17} color={theme.colors.primary} />
          <Text style={styles.dropTitleCompact}>{title}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.dropzone}
          activeOpacity={0.85}
          onPress={pick}>
          <View style={styles.dropIcon}>
            <UploadIcon size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.dropTitle}>{title}</Text>
          <Text style={styles.dropSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
      )}

      {uris.length > 0 ? (
        <View style={styles.thumbs}>
          {uris.map(uri => (
            <View key={uri} style={styles.thumb}>
              <Image source={{uri}} style={styles.thumbImage} />
              <TouchableOpacity
                style={styles.thumbRemove}
                activeOpacity={0.8}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={() => onChange(uris.filter(u => u !== uri))}>
                <XIcon size={10} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.lg},
  fieldCompact: {marginTop: 11},
  dropzoneCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
  },
  dropTitleCompact: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
  dropzone: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 18,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
  },
  dropIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  dropTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
  dropSubtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 11},
  thumb: {width: 52, height: 52},
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    backgroundColor: theme.colors.text,
  },
});

export default UploadField;
