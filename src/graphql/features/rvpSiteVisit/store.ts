import {RvpSiteVisitDetail} from '../../../types/rvpSiteVisit';
import {MOCK_RVP_SITE_VISITS} from '../../../mocks/rvpSiteVisit';

export const rvpSiteVisitStore: {records: RvpSiteVisitDetail[]} = {
  records: MOCK_RVP_SITE_VISITS,
};

export function findRecord(id: string): RvpSiteVisitDetail | undefined {
  return rvpSiteVisitStore.records.find(r => r.id === id);
}

/**
 * One past the highest, unpadded — the seed tops out at `#RVP-1188`, so a fresh
 * form opens on `#RVP-1189`, the reference the handoff's own create screen
 * shows.
 */
export function nextReference(): string {
  const highest = rvpSiteVisitStore.records.reduce((max, record) => {
    const n = Number(record.reference.replace('#RVP-', ''));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `#RVP-${highest + 1}`;
}
