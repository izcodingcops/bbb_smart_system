import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {theme} from '../theme';

export interface UploadedImage {
  uri: string;
  name: string;
  type: string;
}

interface Props {
  value: UploadedImage | null;
  onChange: (file: UploadedImage | null) => void;
  testID?: string;
}

const ImageUploadField: React.FC<Props> = ({value, onChange, testID = 'image-upload'}) => {
  const pickImage = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1});
    const asset = result.assets?.[0];
    if (asset?.uri) {
      onChange({
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.type ?? 'image/jpeg',
      });
    }
  };

  if (value) {
    return (
      <View style={styles.previewWrap} testID={testID}>
        <Image source={{uri: value.uri}} style={styles.preview} />
        <TouchableOpacity
          testID={`${testID}-remove`}
          style={styles.removeBtn}
          onPress={() => onChange(null)}
          activeOpacity={0.7}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      testID={`${testID}-trigger`}
      style={styles.uploadBox}
      onPress={pickImage}
      activeOpacity={0.7}>
      <Text style={styles.uploadText}>Upload Image</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {fontFamily: theme.fonts.bold, color: theme.colors.primary, fontSize: theme.fontSize.xs + 2},
  previewWrap: {position: 'relative', alignSelf: 'flex-start'},
  preview: {width: 96, height: 96, borderRadius: theme.radius.md},
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {color: theme.colors.white, fontFamily: theme.fonts.bold, fontSize: theme.fontSize.xs},
});

export default ImageUploadField;
