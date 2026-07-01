import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import MaintenanceCard from './MaintenanceCard';
import {MaintenanceRecord} from '../types/maintenance';

const record: MaintenanceRecord = {
  id: '1',
  ticket_number: '#96211407',
  status: 'Open',
  maintenance_type_id: 'Alley Cleaning',
  request_date: '2026-04-20T10:54:00.000Z',
  assignee_type: 'Ambassador',
  priority: 'High',
  address: '3 Rue Des Hauteurs, Val-David, Quebec, J0T 2N0, Canada',
  created_at: '2026-02-21T10:05:00.000Z',
};

describe('MaintenanceCard', () => {
  test('calls onPress when "View Details" is tapped', () => {
    const onPress = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(<MaintenanceCard record={record} onPress={onPress} />);
    });
    act(() => {
      root.root.findByProps({testID: 'maintenance-card-view-details'}).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
