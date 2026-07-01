jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
}));

import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {TextInput} from 'react-native';
import SearchablePickerSheet from './SearchablePickerSheet';

describe('SearchablePickerSheet', () => {
  const options = [
    {id: 1, label: 'Alley Cleaning'},
    {id: 2, label: 'Graffiti Removal'},
    {id: 3, label: 'Snow Removal'},
  ];

  test('calls onSelect with the tapped option', () => {
    const onSelect = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <SearchablePickerSheet
          visible
          title="Maintenance Type"
          options={options}
          onSelect={onSelect}
          onClose={jest.fn()}
        />,
      );
    });
    act(() => {
      root.root.findByProps({testID: 'picker-sheet-option-2'}).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith({id: 2, label: 'Graffiti Removal'});
  });

  test('filters the list as the search query changes', () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <SearchablePickerSheet
          visible
          title="Maintenance Type"
          options={options}
          onSelect={jest.fn()}
          onClose={jest.fn()}
        />,
      );
    });
    act(() => {
      root.root.findByType(TextInput).props.onChangeText('snow');
    });
    const hostInstance = (testID: string) =>
      root.root.findAll(node => node.props.testID === testID && typeof node.type === 'string');
    expect(hostInstance('picker-sheet-option-3')).toHaveLength(1);
    expect(hostInstance('picker-sheet-option-1')).toHaveLength(0);
  });
});
