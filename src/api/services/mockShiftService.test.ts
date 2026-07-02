import {mockShiftService} from './mockShiftService';

describe('mockShiftService.startShift', () => {
  test('resolves an id echoing the submitted task and program', async () => {
    const response = await mockShiftService.startShift({
      actual_shift_date: '2026-07-02T09:00:00-04:00',
      actual_shift_end_date: '2026-07-02T17:00:00-04:00',
      task_id: 'task-1',
      program_id: '1',
      timezone_str: 'America/New_York',
      server_date: '2026-07-02T09:00:00-04:00',
    });

    expect(response.status).toBe(200);
    expect(response.data.id).toBeTruthy();
    expect(response.data.task_id).toBe('task-1');
  });
});
