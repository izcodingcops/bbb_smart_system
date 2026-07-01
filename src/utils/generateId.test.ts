import {generateId} from './generateId';

describe('generateId', () => {
  test('returns a v4-shaped UUID string', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  test('generates unique values across calls', () => {
    const ids = new Set(Array.from({length: 100}, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
