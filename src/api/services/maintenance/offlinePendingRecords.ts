import {OfflineRecord} from '../../../types/offline';
import {MaintenanceRecord, MaintenancePayload} from '../../../types/maintenance';

const MAINTENANCE_CREATE_ENDPOINT = 'addMaintenance-v2';

export function pendingMaintenanceRecords(pending: OfflineRecord[]): MaintenanceRecord[] {
  return pending
    .filter(record => record.endpoint === MAINTENANCE_CREATE_ENDPOINT)
    .map(record => {
      const payload = record.payload as unknown as MaintenancePayload;
      return {
        ...payload,
        id: record.id,
        ticket_number: 'Pending',
        status: 'Pending',
        created_at: record.createdAt,
        completed_by: null,
        completed_on: null,
        payment_status: 'Un-Paid',
      };
    });
}
