import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { queryKeys } from '../lib/queryClient';
import {
  fetchWorkspaces,
  createWorkspace,
  CreateWorkspacePayload,
} from '../services/workspace.service';
import { Workspace } from '../types';

/**
 * Workspaces belonging to an organization, plus the currently selected one.
 * Mirrors useOrganizations: the list is server state, the selection is Redux.
 */
export const useWorkspaces = (orgId: string | null | undefined) => {
  const { activeWorkspaceId } = useSelector((state: RootState) => state.workspace);

  const query = useQuery({
    queryKey: queryKeys.workspaces(orgId ?? ''),
    queryFn: () => fetchWorkspaces(orgId as string),
    enabled: Boolean(orgId),
  });

  const workspaces: Workspace[] = query.data ?? [];
  const activeWorkspace =
    workspaces.find((ws) => ws._id === activeWorkspaceId) ?? workspaces[0] ?? null;

  return { ...query, workspaces, activeWorkspace };
};

/** Persist a new workspace, then refresh that organization's workspace list. */
export const useCreateWorkspace = (orgId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkspacePayload) =>
      createWorkspace(orgId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces(orgId ?? '') });
    },
  });
};
