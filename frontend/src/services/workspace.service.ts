import { apiClient, ApiSuccess } from '../lib/apiClient';
import { Workspace, OrgRole } from '../types';

/** Module 3 — Workspace Management. */

export const fetchWorkspaces = async (orgId: string): Promise<Workspace[]> => {
  const { data } = await apiClient.get<ApiSuccess<{ workspaces: Workspace[] }>>(
    `/organizations/${orgId}/workspaces`
  );
  return data.data.workspaces;
};

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  terminalEnabled?: boolean;
  aiEnabled?: boolean;
}

export const createWorkspace = async (
  orgId: string,
  payload: CreateWorkspacePayload
): Promise<Workspace> => {
  const { data } = await apiClient.post<ApiSuccess<{ workspace: Workspace }>>(
    `/organizations/${orgId}/workspaces`,
    payload
  );
  return data.data.workspace;
};

export const fetchWorkspace = async (
  workspaceId: string
): Promise<{ workspace: Workspace; memberRole: OrgRole }> => {
  const { data } = await apiClient.get<
    ApiSuccess<{ workspace: Workspace; memberRole: OrgRole }>
  >(`/workspaces/${workspaceId}`);
  return data.data;
};
