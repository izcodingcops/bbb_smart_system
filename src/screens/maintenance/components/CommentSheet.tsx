import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import type {ImagePickerResponse} from 'react-native-image-picker';
import {BottomSheet, FieldLabel, TextField} from '../../../components/ui';
import {CameraIcon, ImageIcon, XIcon} from '../../../components/icons';
import {MaintenanceComment} from '../../../types/maintenance';
import {theme} from '../../../theme';

interface Props {
  visible: boolean;
  /** null adds a comment; a comment edits it in place. */
  comment: MaintenanceComment | null;
  onSubmit: (text: string, images: string[]) => void;
  onClose: () => void;
}

/**
 * Gallery and Camera only — the design also offers a file browser, which would
 * need a document-picker native module we don't ship.
 */
const CommentSheet: React.FC<Props> = ({
  visible,
  comment,
  onSubmit,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Re-seed on open: add mode starts blank, edit mode starts from the comment.
  useEffect(() => {
    if (visible) {
      setText(comment?.text ?? '');
      setImages(comment?.images ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const collect = (result: ImagePickerResponse) => {
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert("Couldn't attach that", result.errorMessage ?? 'Try again.');
      return;
    }
    const picked = (result.assets ?? [])
      .map(asset => asset.uri)
      .filter((uri): uri is string => !!uri);
    setImages(current => [...current, ...picked]);
  };

  const canPost = text.trim().length > 0;

  return (
    <BottomSheet
      visible={visible}
      title={comment ? 'Edit Comment' : 'Add Comment'}
      onClose={onClose}>
      <View style={styles.field}>
        <FieldLabel label="Comment" />
        <TextField
          placeholder="Write a comment about this maintenance…"
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={4}
          style={styles.textarea}
        />
      </View>

      <View style={styles.field}>
        <FieldLabel label="Attachment (optional)" />
        <View style={styles.attachRow}>
          <TouchableOpacity
            style={styles.attachButton}
            activeOpacity={0.85}
            onPress={async () =>
              collect(
                await launchImageLibrary({
                  mediaType: 'photo',
                  selectionLimit: 0,
                }),
              )
            }>
            <ImageIcon size={20} />
            <Text style={styles.attachText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachButton}
            activeOpacity={0.85}
            onPress={async () =>
              collect(
                await launchCamera({mediaType: 'photo', saveToPhotos: false}),
              )
            }>
            <CameraIcon size={20} />
            <Text style={styles.attachText}>Camera</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.help}>JPG or PNG · up to 10 MB per file.</Text>

        {images.length > 0 ? (
          <View style={styles.thumbs}>
            {images.map(uri => (
              <View key={uri} style={styles.thumb}>
                <Image source={{uri}} style={styles.thumbImage} />
                <TouchableOpacity
                  style={styles.thumbRemove}
                  activeOpacity={0.8}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  onPress={() =>
                    setImages(current => current.filter(u => u !== uri))
                  }>
                  <XIcon size={10} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancel]}
          activeOpacity={0.85}
          onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.post, !canPost && styles.postDisabled]}
          activeOpacity={0.85}
          disabled={!canPost}
          onPress={() => {
            onSubmit(text.trim(), images);
            onClose();
          }}>
          <Text style={styles.postText}>
            {comment ? 'Save Comment' : 'Post Comment'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.lg},
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  attachRow: {flexDirection: 'row', gap: 9},
  attachButton: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
  },
  attachText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.primary,
  },
  help: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: 7,
  },
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10},
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
  footer: {flexDirection: 'row', gap: 11, marginTop: theme.spacing.md},
  button: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {backgroundColor: '#F0F1F4'},
  cancelText: {fontFamily: theme.fonts.black, fontSize: 15.5, color: '#3A3F46'},
  post: {backgroundColor: theme.colors.primary},
  postDisabled: {opacity: 0.45},
  postText: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: theme.colors.white,
  },
});

export default CommentSheet;
