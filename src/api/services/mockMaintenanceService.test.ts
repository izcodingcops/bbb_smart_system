import {mockMaintenanceService} from './mockMaintenanceService';

async function flush<T>(promise: Promise<T>): Promise<T> {
  jest.advanceTimersByTime(500);
  return promise;
}

describe('mockMaintenanceService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMaintenanceService.__reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('list returns the seeded records', async () => {
    const result = await flush(mockMaintenanceService.list(1, {}));
    expect(result.status).toBe(200);
    expect(result.data.rows.length).toBeGreaterThan(0);
  });

  test('list applies priority and status filters', async () => {
    const result = await flush(mockMaintenanceService.list(1, {priority: 'High', status: 'Open'}));
    expect(result.data.rows.every(r => r.priority === 'High' && r.status === 'Open')).toBe(true);
    expect(result.data.rows.length).toBeGreaterThan(0);
  });

  test('detail returns a seeded record by id', async () => {
    const result = await flush(mockMaintenanceService.detail('seed-1'));
    expect(result.data.id).toBe('seed-1');
  });

  test('detail rejects for an unknown id', async () => {
    await expect(flush(mockMaintenanceService.detail('missing'))).rejects.toThrow(
      'Maintenance request not found.',
    );
  });

  test('create adds a new record that then appears in the list', async () => {
    const created = await flush(
      mockMaintenanceService.create({
        maintenance_type_id: 'alley-cleaning',
        request_date: '2026-05-01T10:00:00.000Z',
        assignee_type: 'Ambassador',
        user_id: 'amb-tom-lee',
        priority: 'Low',
        address: '45.5, -73.6',
      }),
    );
    expect(created.data.status).toBe('Open');
    expect(created.data.ticket_number).toMatch(/^#\d+$/);

    const list = await flush(mockMaintenanceService.list(1, {}));
    expect(list.data.rows.some(r => r.id === created.data.id)).toBe(true);
  });

  test('update mutates the existing record', async () => {
    const updated = await flush(
      mockMaintenanceService.update('seed-1', {
        maintenance_type_id: 'alley-cleaning',
        request_date: '2026-05-01T10:00:00.000Z',
        assignee_type: 'Ambassador',
        user_id: 'amb-tom-lee',
        priority: 'Medium',
        address: '45.5, -73.6',
      }),
    );
    expect(updated.data.priority).toBe('Medium');
  });

  test('remove deletes the record', async () => {
    await flush(mockMaintenanceService.remove('seed-1'));
    await expect(flush(mockMaintenanceService.detail('seed-1'))).rejects.toThrow(
      'Maintenance request not found.',
    );
  });

  test('addComment stores a comment for the record', async () => {
    const result = await flush(mockMaintenanceService.addComment('seed-1', 'Looks good'));
    expect(result.data.text).toBe('Looks good');
  });

  test('getDropdowns returns seeded dropdown options', async () => {
    const result = await flush(mockMaintenanceService.getDropdowns());
    expect(result.data.types.length).toBeGreaterThan(0);
    expect(result.data.ambassadors.length).toBeGreaterThan(0);
    expect(result.data.zones.length).toBeGreaterThan(0);
  });
});
