jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {launchImageLibrary} from 'react-native-image-picker';
import ImageUploadField from './ImageUploadField';

describe('ImageUploadField', () => {
  test('shows the upload trigger when no image is selected, and reports the picked asset', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValue({
      assets: [{uri: 'file:///photo.jpg', fileName: 'photo.jpg', type: 'image/jpeg'}],
    });
    const onChange = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <ImageUploadField value={null} onChange={onChange} testID="maintenance-image" />,
      );
    });

    await act(async () => {
      await root.root.findByProps({testID: 'maintenance-image-trigger'}).props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      uri: 'file:///photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
  });

  test('shows a remove button and clears the value when a file is already selected', () => {
    const onChange = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <ImageUploadField
          value={{uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg'}}
          onChange={onChange}
          testID="maintenance-image"
        />,
      );
    });
    act(() => {
      root.root.findByProps({testID: 'maintenance-image-remove'}).props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
