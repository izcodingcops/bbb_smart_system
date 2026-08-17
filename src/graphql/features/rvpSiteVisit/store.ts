import {RvpSiteVisitDetail} from '../../../types/rvpSiteVisit';
import {MOCK_RVP_SITE_VISITS} from '../../../mocks/rvpSiteVisit';

export const rvpSiteVisitStore: {records: RvpSiteVisitDetail[]} = {
  records: MOCK_RVP_SITE_VISITS,
};

export function findRecord(id: string): RvpSiteVisitDetail | undefined {
  return rvpSiteVisitStore.records.find(r => r.id === id);
}
