import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client (SRS 5.13 — server state).
 *
 * Auth failures are surfaced to the app by the Axios interceptor, so there is
 * no value in retrying a request that failed because the session ended.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Centralized cache keys so invalidation stays consistent across features. */
export const queryKeys = {
  organizations: ['organizations'] as const,
  organization: (orgId: string) => ['organizations', orgId] as const,
  workspaces: (orgId: string) => ['organizations', orgId, 'workspaces'] as const,
  workspace: (workspaceId: string) => ['workspaces', workspaceId] as const,

  // Modules 4 & 6. `projects` is the prefix every filtered list shares, so
  // invalidating it refreshes the list under any search/filter combination.
  projects: (workspaceId: string) => ['workspaces', workspaceId, 'projects'] as const,
  projectList: (workspaceId: string, filters: Record<string, unknown>) =>
    ['workspaces', workspaceId, 'projects', filters] as const,
  project: (projectId: string) => ['projects', projectId] as const,
  fileTree: (projectId: string) => ['projects', projectId, 'files'] as const,
  fileContent: (projectId: string, path: string) =>
    ['projects', projectId, 'files', 'content', path] as const,
};
