import { apiClient } from '../lib/apiClient';

export interface GitFileStatus {
  path: string;
  status: string;
  staged: boolean;
}

export interface GitStatusData {
  currentBranch: string;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
}

export const gitService = {
  getStatus: async (projectId: string): Promise<GitStatusData> => {
    const response = await apiClient.get<{ status: string; data: GitStatusData }>(`/git/${projectId}/status`);
    return response.data.data;
  },

  commit: async (projectId: string, message: string) => {
    const response = await apiClient.post(`/git/${projectId}/commit`, { message });
    return response.data;
  },

  getBranches: async (projectId: string) => {
    const response = await apiClient.get(`/git/${projectId}/branches`);
    return response.data.data;
  },
};
