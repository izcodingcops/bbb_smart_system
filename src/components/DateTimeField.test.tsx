jest.mock('@react-native-community/datetimepicker', () => {
  const {View} = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => <View testID={props.testID} {...props} />,
  };
});

import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import DateTimeField from './DateTimeField';

describe('DateTimeField', () => {
  test('shows the picker after the input is pressed, and reports the chosen date', () => {
    const onChange = jest.fn();
    const initial = new Date('2026-04-20T10:54:00');
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <DateTimeField label="Request Date & Time" value={initial} onChange={onChange} testID="request-date" />,
      );
    });

    expect(() => root.root.findByProps({testID: 'request-date-picker'})).toThrow();

    act(() => {
      root.root.findByProps({testID: 'request-date-trigger'}).props.onPress();
    });

    const picker = root.root.findByProps({testID: 'request-date-picker'});
    const chosen = new Date('2026-04-21T09:00:00');
    act(() => {
      picker.props.onChange({type: 'set'}, chosen);
    });

    expect(onChange).toHaveBeenCalledWith(chosen);
  });
});
