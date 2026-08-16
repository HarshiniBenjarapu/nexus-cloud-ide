import { apiClient, ApiSuccess } from '../lib/apiClient';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'idle' | 'offline';
  activeFile?: string;
}

export interface InviteResult {
  inviteId: string;
  email: string;
  role: string;
  workspaceId: string;
  status: string;
  invitedAt: string;
}

export const collaborationService = {
  getWorkspacePresence: async (workspaceId: string): Promise<Collaborator[]> => {
    const { data } = await apiClient.get<ApiSuccess<Collaborator[]>>(`/collaboration/presence/${workspaceId}`);
    return data.data;
  },

  inviteMember: async (payload: {
    email: string;
    role?: 'Owner' | 'Admin' | 'Member' | 'Viewer';
    workspaceId?: string;
  }): Promise<InviteResult> => {
    const { data } = await apiClient.post<ApiSuccess<InviteResult>>('/collaboration/invite', payload);
    return data.data;
  },
};
