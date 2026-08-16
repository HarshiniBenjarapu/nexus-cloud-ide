import { apiClient, ApiSuccess } from '../lib/apiClient';
import { OrgRole, Pagination, Project, SupportedTemplate } from '../types';

/** Module 4 — Project Management. */

export interface ListProjectsParams {
  search?: string;
  template?: SupportedTemplate;
  favorite?: boolean;
  /** Archived projects are excluded unless explicitly requested (SRS 6.22). */
  archived?: boolean;
  sort?: 'recent' | 'name' | 'created';
  page?: number;
  limit?: number;
}

export interface ProjectListResult {
  projects: Project[];
  pagination: Pagination;
  memberRole: OrgRole;
}

export const fetchProjects = async (
  workspaceId: string,
  params: ListProjectsParams = {}
): Promise<ProjectListResult> => {
  const { data } = await apiClient.get<ApiSuccess<ProjectListResult>>(
    `/workspaces/${workspaceId}/projects`,
    { params }
  );
  return data.data;
};

export interface CreateProjectPayload {
  name: string;
  description?: string;
  template: SupportedTemplate;
  visibility?: 'public' | 'private';
  gitEnabled?: boolean;
  deploymentEnabled?: boolean;
}

export const createProject = async (
  workspaceId: string,
  payload: CreateProjectPayload
): Promise<Project> => {
  const { data } = await apiClient.post<ApiSuccess<{ project: Project }>>(
    `/workspaces/${workspaceId}/projects`,
    payload
  );
  return data.data.project;
};

export const fetchProject = async (
  projectId: string
): Promise<{ project: Project; memberRole: OrgRole }> => {
  const { data } = await apiClient.get<
    ApiSuccess<{ project: Project; memberRole: OrgRole }>
  >(`/projects/${projectId}`);
  return data.data;
};

/** Settings, rename, and the favorite toggle all go through PATCH (SRS 6.19). */
export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
  gitEnabled?: boolean;
  deploymentEnabled?: boolean;
  isFavorite?: boolean;
}

export const updateProject = async (
  projectId: string,
  payload: UpdateProjectPayload
): Promise<Project> => {
  const { data } = await apiClient.patch<ApiSuccess<{ project: Project }>>(
    `/projects/${projectId}`,
    payload
  );
  return data.data.project;
};

/** Omit `name` to let the backend derive "<name> copy" and avoid collisions. */
export const duplicateProject = async (
  projectId: string,
  name?: string
): Promise<Project> => {
  const { data } = await apiClient.post<ApiSuccess<{ project: Project }>>(
    `/projects/${projectId}/duplicate`,
    name ? { name } : {}
  );
  return data.data.project;
};

export const archiveProject = async (projectId: string): Promise<Project> => {
  const { data } = await apiClient.patch<ApiSuccess<{ project: Project }>>(
    `/projects/${projectId}/archive`
  );
  return data.data.project;
};

export const restoreProject = async (projectId: string): Promise<Project> => {
  const { data } = await apiClient.patch<ApiSuccess<{ project: Project }>>(
    `/projects/${projectId}/restore`
  );
  return data.data.project;
};

/** Soft delete — the row and its files are retained for recovery (SRS 6.21). */
export const deleteProject = async (projectId: string): Promise<void> => {
  await apiClient.delete(`/projects/${projectId}`);
};
