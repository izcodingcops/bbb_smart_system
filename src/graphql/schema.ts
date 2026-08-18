import {authTypeDefs} from './features/auth/schema';
import {dispatchTypeDefs} from './features/dispatch/schema';
import {equipmentTypeDefs} from './features/equipment/schema';
import {fixtureTypeDefs} from './features/fixture/schema';
import {incidentTypeDefs} from './features/incident/schema';
import {maintenanceTypeDefs} from './features/maintenance/schema';
import {navigationTypeDefs} from './features/navigation/schema';
import {offHoursVisitTypeDefs} from './features/offHoursVisit/schema';
import {notificationTypeDefs} from './features/notification/schema';
import {observationReportTypeDefs} from './features/observationReport/schema';
import {poiTypeDefs} from './features/poi/schema';
import {referenceDocumentTypeDefs} from './features/referenceDocument/schema';
import {rvpSiteVisitTypeDefs} from './features/rvpSiteVisit/schema';
import {workTypeDefs} from './features/work/schema';
import {workLogTypeDefs} from './features/workLog/schema';

/**
 * Every feature `extend`s these two roots, so they have to exist first. When
 * the backend publishes an SDL, replace the feature files with theirs and any
 * drift surfaces immediately as a failing document.
 */
const rootTypeDefs = /* GraphQL */ `
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  rootTypeDefs,
  authTypeDefs,
  navigationTypeDefs,
  workTypeDefs,
  equipmentTypeDefs,
  maintenanceTypeDefs,
  fixtureTypeDefs,
  incidentTypeDefs,
  dispatchTypeDefs,
  poiTypeDefs,
  workLogTypeDefs,
  notificationTypeDefs,
  observationReportTypeDefs,
  referenceDocumentTypeDefs,
  rvpSiteVisitTypeDefs,
  offHoursVisitTypeDefs,
].join('\n');
