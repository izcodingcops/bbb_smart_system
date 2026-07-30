import {FixtureDetail} from '../../../types/fixture';
import {MOCK_FIXTURES} from '../../../mocks/fixture';

/** Same static demo coordinates the design's mockup hardcodes for every record. */
const DETAIL_DEFAULTS = {
  describeLocation: null as string | null,
  latitude: '30.673854' as string | null,
  longitude: '73.673854' as string | null,
  description: null as string | null,
  documents: [] as string[],
};

/** Seeded once per app session; mutations edit this array in place. */
export const fixtureStore: {records: FixtureDetail[]} = {
  records: MOCK_FIXTURES.map(fixture => ({...DETAIL_DEFAULTS, ...fixture})),
};

export function findRecord(id: string): FixtureDetail | undefined {
  return fixtureStore.records.find(r => r.id === id);
}

/** One past the highest existing number, so created records sort to the top. */
export function nextReference(): string {
  const max = fixtureStore.records.reduce((acc, r) => {
    const n = Number(r.reference.replace('#FX-', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#FX-${max + 1}`;
}
