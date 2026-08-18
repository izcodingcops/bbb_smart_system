import {ObservationReport} from '../../../types/observationReport';
import {AmbassadorRecord, AmbassadorWork} from '../../../types/ambassador';
import {sleep} from '../../mockSession';
import {observationReportStore} from '../observationReport/store';
import {toWire as toReportWire} from '../observationReport/resolvers';
import {
  ambassadorStore,
  ambassadorWorkStore,
  findAmbassador,
  findAmbassadorWork,
} from './store';

const STATUS_OUT: Record<AmbassadorRecord['status'], string> = {
  Active: 'ACTIVE',
  'In-active': 'IN_ACTIVE',
  Suspended: 'SUSPENDED',
};

const WORK_TYPE_OUT: Record<AmbassadorWork['type'], string> = {
  Cleaning: 'CLEANING',
  Maintenance: 'MAINTENANCE',
};

const WORK_STATUS_OUT: Record<AmbassadorWork['status'], string> = {
  Completed: 'COMPLETED',
  'In Progress': 'IN_PROGRESS',
  Open: 'OPEN',
};

function workOf(ambassadorId: string): AmbassadorWork[] {
  return ambassadorWorkStore.records.filter(w => w.ambassadorId === ambassadorId);
}

/**
 * The only link between an Ambassador record and a real ObservationReport is
 * a name match — there's no ambassador id on ObservationReport, the same
 * free-text-name limitation every other cross-module reference in this app
 * has (WorkItem.assignee, Maintenance's ambassador field). Case-insensitive
 * because one of that store's own scraped-real records ('Arslan saeed')
 * disagrees in case with this roster's 'Arslan Saeed' — the report stays as
 * scraped, mismatches and all, per this app's mock-data convention; this is
 * what bridges it rather than "fixing" that record.
 */
function reportsOf(ambassador: AmbassadorRecord): ObservationReport[] {
  const name = ambassador.name.trim().toLowerCase();
  return observationReportStore.records.filter(
    r => r.type === 'Ambassador' && r.name.trim().toLowerCase() === name,
  );
}

/**
 * `totalWork`/`totalReports` are never stored — recomputed here on every
 * read from the two stores they actually count, so a client can't inflate
 * either and a new work item or report shows up without touching this record.
 */
const toWire = (record: AmbassadorRecord) => ({
  ...record,
  status: STATUS_OUT[record.status],
  totalWork: workOf(record.id).length,
  totalReports: reportsOf(record).length,
});

const toWorkWire = (record: AmbassadorWork) => ({
  ...record,
  type: WORK_TYPE_OUT[record.type],
  status: WORK_STATUS_OUT[record.status],
});

export const ambassadorResolvers = {
  Query: {
    // No filter argument: the screen searches, sorts and filters
    // client-side, same convention as Observation Reports and RVP.
    ambassadors: async () => {
      await sleep();
      return ambassadorStore.records.map(toWire);
    },

    ambassador: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findAmbassador(args.id);
      return record ? toWire(record) : null;
    },

    ambassadorWork: async (_: unknown, args: {ambassadorId: string}) => {
      await sleep();
      return workOf(args.ambassadorId).map(toWorkWire);
    },

    ambassadorWorkItem: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findAmbassadorWork(args.id);
      return record ? toWorkWire(record) : null;
    },

    ambassadorReports: async (_: unknown, args: {ambassadorId: string}) => {
      await sleep();
      const ambassador = findAmbassador(args.ambassadorId);
      if (!ambassador) {
        return [];
      }
      return reportsOf(ambassador).map(toReportWire);
    },
  },
};
