import { apiClient, ApiSuccess } from '../lib/apiClient';

export interface WorkspaceAnalyticsData {
  storageUsedMb: number;
  storageLimitMb: number;
  cpuUsagePct: number;
  ramUsageMb: number;
  ramLimitMb: number;
  activeContainers: number;
  totalDeployments: number;
  buildSuccessRate: number;
  activityLogs: { time: string; event: string }[];
}

export const analyticsService = {
  getWorkspaceAnalytics: async (workspaceId: string): Promise<WorkspaceAnalyticsData> => {
    const { data } = await apiClient.get<ApiSuccess<WorkspaceAnalyticsData>>(`/analytics/workspace/${workspaceId}`);
    return data.data;
  },
};
