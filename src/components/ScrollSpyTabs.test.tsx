import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import ScrollSpyTabs from './ScrollSpyTabs';

describe('ScrollSpyTabs', () => {
  const tabs = [
    {key: 'basic', label: 'Basic Details'},
    {key: 'location', label: 'Location Details'},
    {key: 'other', label: 'Other Details'},
  ];

  test('calls onTabPress with the tapped tab key', () => {
    const onTabPress = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <ScrollSpyTabs tabs={tabs} activeKey="basic" onTabPress={onTabPress} />,
      );
    });
    act(() => {
      root.root.findByProps({testID: 'scroll-spy-tab-other'}).props.onPress();
    });
    expect(onTabPress).toHaveBeenCalledWith('other');
  });
});
