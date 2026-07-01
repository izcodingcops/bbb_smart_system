import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import AssigneeTypeSelector from './AssigneeTypeSelector';

describe('AssigneeTypeSelector', () => {
  test('calls onChange with the pressed assignee type', () => {
    const onChange = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(<AssigneeTypeSelector value={null} onChange={onChange} />);
    });
    act(() => {
      root.root.findByProps({testID: 'assignee-type-selector-Department'}).props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('Department');
  });
});
