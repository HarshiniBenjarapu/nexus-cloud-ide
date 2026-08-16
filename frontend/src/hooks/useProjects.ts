import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  duplicateProject,
  archiveProject,
  restoreProject,
  deleteProject,
  CreateProjectPayload,
  UpdateProjectPayload,
  ListProjectsParams,
} from '../services/project.service';
import { OrgRole, Project } from '../types';

/**
 * Module 4 — Projects.
 *
 * Mirrors useWorkspaces: the collection is server state in TanStack Query, and
 * only the *selection* lives in Redux (SRS 5.13). Every mutation invalidates the
 * workspace's project list so the dashboard and the IDE never disagree.
 */

export const useProjects = (
  workspaceId: string | null | undefined,
  filters: ListProjectsParams = {}
) => {
  const query = useQuery({
    queryKey: queryKeys.projectList(workspaceId ?? '', filters as Record<string, unknown>),
    queryFn: () => fetchProjects(workspaceId as string, filters),
    enabled: Boolean(workspaceId),
  });

  const projects: Project[] = query.data?.projects ?? [];

  return {
    ...query,
    projects,
    pagination: query.data?.pagination ?? null,
    memberRole: query.data?.memberRole ?? null,
  };
};

/** A single project plus the caller's role, for the IDE shell. */
export const useProject = (projectId: string | null | undefined) => {
  const query = useQuery({
    queryKey: queryKeys.project(projectId ?? ''),
    queryFn: () => fetchProject(projectId as string),
    enabled: Boolean(projectId),
  });

  return {
    ...query,
    project: query.data?.project ?? null,
    memberRole: (query.data?.memberRole ?? null) as OrgRole | null,
  };
};

/**
 * Invalidate every cached list for a workspace regardless of its filters.
 * Filtered lists are keyed by a filters object, so the shared prefix is the
 * only reliable way to catch them all.
 */
const useInvalidateProjects = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId ?? '') });
};

export const useCreateProject = (workspaceId: string | null | undefined) => {
  const invalidate = useInvalidateProjects(workspaceId);

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      createProject(workspaceId as string, payload),
    onSuccess: invalidate,
  });
};

export const useUpdateProject = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProjects(workspaceId);

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: UpdateProjectPayload;
    }) => updateProject(projectId, payload),
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.project(project._id), {
        project,
        memberRole: queryClient.getQueryData<{ memberRole: OrgRole }>(
          queryKeys.project(project._id)
        )?.memberRole,
      });
      invalidate();
    },
  });
};

export const useDuplicateProject = (workspaceId: string | null | undefined) => {
  const invalidate = useInvalidateProjects(workspaceId);

  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name?: string }) =>
      duplicateProject(projectId, name),
    onSuccess: invalidate,
  });
};

export const useArchiveProject = (workspaceId: string | null | undefined) => {
  const invalidate = useInvalidateProjects(workspaceId);

  return useMutation({
    mutationFn: ({ projectId, archived }: { projectId: string; archived: boolean }) =>
      archived ? archiveProject(projectId) : restoreProject(projectId),
    onSuccess: invalidate,
  });
};

export const useDeleteProject = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProjects(workspaceId);

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.removeQueries({ queryKey: queryKeys.project(projectId) });
      invalidate();
    },
  });
};
