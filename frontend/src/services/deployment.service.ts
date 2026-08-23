import { apiClient, ApiSuccess } from '../lib/apiClient';

export interface DeploymentRecord {
  _id: string;
  projectId: string;
  provider: 'vercel' | 'netlify' | 'render' | 'aws_container';
  status: 'queued' | 'building' | 'deployed' | 'failed';
  liveUrl?: string;
  buildLogs: string[];
  envVars?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export const deploymentService = {
  triggerDeployment: async (payload: {
    projectId: string;
    provider?: 'vercel' | 'netlify' | 'render' | 'aws_container';
    envVars?: Record<string, string>;
  }): Promise<DeploymentRecord> => {
    const { data } = await apiClient.post<ApiSuccess<DeploymentRecord>>('/deployments', payload);
    return data.data;
  },

  getProjectDeployments: async (projectId: string): Promise<DeploymentRecord[]> => {
    const { data } = await apiClient.get<ApiSuccess<DeploymentRecord[]>>(`/deployments/project/${projectId}`);
    return data.data;
  },

  getDeploymentDetails: async (id: string): Promise<DeploymentRecord> => {
    const { data } = await apiClient.get<ApiSuccess<DeploymentRecord>>(`/deployments/${id}`);
    return data.data;
  },

  syncStatus: async (id: string): Promise<DeploymentRecord> => {
    const { data } = await apiClient.get<ApiSuccess<DeploymentRecord>>(`/deployments/${id}/sync`);
    return data.data;
  },

  redeploy: async (id: string): Promise<DeploymentRecord> => {
    const { data } = await apiClient.post<ApiSuccess<DeploymentRecord>>(`/deployments/${id}/redeploy`);
    return data.data;
  },

  deleteDeployment: async (id: string): Promise<void> => {
    await apiClient.delete(`/deployments/${id}`);
  },
};
