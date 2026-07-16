import {QuickAction, WorkItem} from '../../../types/work';

export interface WorkListResponse {
  status: number;
  data: WorkItem[];
}

export interface QuickActionsResponse {
  status: number;
  data: QuickAction[];
}

export interface WorkServiceContract {
  getWorkItems: () => Promise<WorkListResponse>;
  getQuickActions: () => Promise<QuickActionsResponse>;
}
