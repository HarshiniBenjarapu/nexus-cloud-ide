import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  fetchFileTree,
  fetchFileContent,
  saveFileContent,
  createEntry,
  renameEntry,
  duplicateEntry,
  deleteEntry,
  CreateEntryPayload,
} from '../services/file.service';
import { FileNode, OrgRole } from '../types';

/**
 * Module 6 — File Explorer.
 *
 * The tree is server state; file *contents* are fetched per path on demand and
 * then handed to Redux as editor tabs, because once a file is open its buffer is
 * client state the user is actively editing.
 */

export const useFileTree = (projectId: string | null | undefined) => {
  const query = useQuery({
    queryKey: queryKeys.fileTree(projectId ?? ''),
    queryFn: () => fetchFileTree(projectId as string),
    enabled: Boolean(projectId),
  });

  const tree: FileNode[] = query.data?.tree ?? [];

  return {
    ...query,
    tree,
    memberRole: (query.data?.memberRole ?? null) as OrgRole | null,
  };
};

/** Every structural change reshapes the tree, so they all invalidate it. */
const useInvalidateTree = (projectId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.fileTree(projectId ?? '') });
};

export const useCreateEntry = (projectId: string | null | undefined) => {
  const invalidate = useInvalidateTree(projectId);

  return useMutation({
    mutationFn: (payload: CreateEntryPayload) =>
      createEntry(projectId as string, payload),
    onSuccess: invalidate,
  });
};

export const useRenameEntry = (projectId: string | null | undefined) => {
  const invalidate = useInvalidateTree(projectId);

  return useMutation({
    mutationFn: ({ path, newName }: { path: string; newName: string }) =>
      renameEntry(projectId as string, path, newName),
    onSuccess: invalidate,
  });
};

export const useDuplicateEntry = (projectId: string | null | undefined) => {
  const invalidate = useInvalidateTree(projectId);

  return useMutation({
    mutationFn: ({ path, newName }: { path: string; newName?: string }) =>
      duplicateEntry(projectId as string, path, newName),
    onSuccess: invalidate,
  });
};

export const useDeleteEntry = (projectId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTree(projectId);

  return useMutation({
    mutationFn: (path: string) => deleteEntry(projectId as string, path),
    onSuccess: (result) => {
      queryClient.removeQueries({
        queryKey: queryKeys.fileContent(projectId ?? '', result.path),
      });
      invalidate();
    },
  });
};

export const useSaveFile = (projectId: string | null | undefined) => {
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      saveFileContent(projectId as string, path, content),
  });
};

/** Imperative read — the explorer opens files on click, not on render. */
export const useReadFile = (projectId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return (path: string) =>
    queryClient.fetchQuery({
      queryKey: queryKeys.fileContent(projectId ?? '', path),
      queryFn: () => fetchFileContent(projectId as string, path),
      staleTime: 0,
    });
};
