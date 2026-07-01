import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  test('fires onConfirm and onCancel from their respective buttons', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <ConfirmDialog
          visible
          title="Save Maintenance"
          message="Do you want to save this maintenance?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      );
    });
    act(() => {
      root.root.findByProps({testID: 'confirm-dialog-confirm'}).props.onPress();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    act(() => {
      root.root.findByProps({testID: 'confirm-dialog-cancel'}).props.onPress();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
