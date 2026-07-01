import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {TouchableOpacity} from 'react-native';
import SegmentedControl from './SegmentedControl';

describe('SegmentedControl', () => {
  const options = [
    {label: 'Low', value: 'Low'},
    {label: 'Medium', value: 'Medium'},
    {label: 'High', value: 'High'},
  ];

  test('calls onChange with the pressed option value', () => {
    const onChange = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <SegmentedControl options={options} value="Low" onChange={onChange} testID="priority" />,
      );
    });
    act(() => {
      root.root.findByProps({testID: 'priority-Medium'}).props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('Medium');
  });

  test('renders one button per option even when nothing is selected', () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <SegmentedControl options={options} value={null} onChange={jest.fn()} testID="priority" />,
      );
    });
    expect(root.root.findAllByType(TouchableOpacity)).toHaveLength(3);
  });
});
