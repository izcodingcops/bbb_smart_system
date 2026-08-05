import {IncidentDetail} from '../../../types/incident';
import {MOCK_INCIDENTS} from '../../../mocks/incident';

/** Seeded once per app session; mutations edit this array in place. */
export const incidentStore: {records: IncidentDetail[]} = {
  records: MOCK_INCIDENTS.map(record => ({...record})),
};

export function findRecord(id: string): IncidentDetail | undefined {
  return incidentStore.records.find(r => r.id === id);
}

const highestReference = (records: IncidentDetail[]) =>
  records.reduce((acc, r) => {
    const n = Number(r.reference.replace('#IN-', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);

/** Highest reference number ever seen — only ever moves up, even when a delete lowers the live store's own max. */
let referenceWatermark = highestReference(incidentStore.records);

/**
 * Preview — idempotent, does not consume the number. Used by
 * `incidentFormOptions` so the form can show "next reference" and the user
 * can open/close it repeatedly without burning numbers. Note this alone does
 * NOT protect against reuse: it only records the watermark at call time, and
 * a create's own record isn't in the store yet when the create's internal
 * preview runs, so a create-then-delete with no intervening preview call
 * would let a later preview see the store back at the old max. Reuse safety
 * comes from `allocateReference` below, which createIncident calls instead.
 */
export function nextReference(): string {
  referenceWatermark = Math.max(referenceWatermark, highestReference(incidentStore.records));
  return `#IN-${referenceWatermark + 1}`;
}

/**
 * Allocation — consumes the number immediately, so no later delete of the
 * new record can cause a subsequent call (preview or allocate) to reissue
 * it. Used by `createIncident`, never by the read-only preview.
 */
export function allocateReference(): string {
  referenceWatermark = Math.max(referenceWatermark, highestReference(incidentStore.records)) + 1;
  return `#IN-${referenceWatermark}`;
}
