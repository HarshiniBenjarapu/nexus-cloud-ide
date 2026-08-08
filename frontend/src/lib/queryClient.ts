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
};
