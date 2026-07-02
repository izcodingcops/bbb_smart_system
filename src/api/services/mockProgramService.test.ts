import {mockProgramService} from './mockProgramService';

describe('mockProgramService', () => {
  test('listPrograms resolves the seeded program list', async () => {
    const response = await mockProgramService.listPrograms();
    expect(response.status).toBe(200);
    expect(response.data.length).toBeGreaterThan(0);
  });

  test('getTaskList resolves a non-empty task list for any program', async () => {
    const response = await mockProgramService.getTaskList('1');
    expect(response.status).toBe(200);
    expect(response.data.rows.length).toBeGreaterThan(0);
  });

  test('selectProgram resolves an id for the given program and shift', async () => {
    const response = await mockProgramService.selectProgram('1', 'task-1');
    expect(response.status).toBe(200);
    expect(response.data.id).toBeTruthy();
  });
});
