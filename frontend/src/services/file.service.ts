import { apiClient, ApiSuccess } from '../lib/apiClient';
import { FileContent, FileNode, OrgRole } from '../types';

/**
 * Module 6 — File Explorer.
 *
 * Paths are project-relative and POSIX ('src/App.tsx'), never absolute and
 * never leading-slash. The backend rejects anything else, so the UI keeps paths
 * in exactly the form the API returns them.
 */

export const fetchFileTree = async (
  projectId: string
): Promise<{ tree: FileNode[]; memberRole: OrgRole }> => {
  const { data } = await apiClient.get<
    ApiSuccess<{ tree: FileNode[]; memberRole: OrgRole }>
  >(`/projects/${projectId}/files`);
  return data.data;
};

export const fetchFileContent = async (
  projectId: string,
  path: string
): Promise<FileContent> => {
  const { data } = await apiClient.get<ApiSuccess<FileContent>>(
    `/projects/${projectId}/files/content`,
    { params: { path } }
  );
  return data.data;
};

export interface SaveFileResult {
  path: string;
  size: number;
  updatedAt: string | null;
}

/** Save an existing file. Creating one goes through createEntry instead. */
export const saveFileContent = async (
  projectId: string,
  path: string,
  content: string
): Promise<SaveFileResult> => {
  const { data } = await apiClient.put<ApiSuccess<SaveFileResult>>(
    `/projects/${projectId}/files/content`,
    { path, content }
  );
  return data.data;
};

export interface EntryResult {
  path: string;
  name: string;
  type: 'file' | 'folder';
}

export interface CreateEntryPayload {
  /** Empty string means the project root. */
  parentPath: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
}

export const createEntry = async (
  projectId: string,
  payload: CreateEntryPayload
): Promise<EntryResult> => {
  const { data } = await apiClient.post<ApiSuccess<EntryResult>>(
    `/projects/${projectId}/files`,
    payload
  );
  return data.data;
};

/** Rename in place — the entry keeps its parent folder (no moves in V1). */
export const renameEntry = async (
  projectId: string,
  path: string,
  newName: string
): Promise<EntryResult> => {
  const { data } = await apiClient.patch<ApiSuccess<EntryResult>>(
    `/projects/${projectId}/files/rename`,
    { path, newName }
  );
  return data.data;
};

/** Omit `newName` to let the backend derive "<name> copy.<ext>". */
export const duplicateEntry = async (
  projectId: string,
  path: string,
  newName?: string
): Promise<EntryResult> => {
  const { data } = await apiClient.post<ApiSuccess<EntryResult>>(
    `/projects/${projectId}/files/duplicate`,
    newName ? { path, newName } : { path }
  );
  return data.data;
};

export const deleteEntry = async (
  projectId: string,
  path: string
): Promise<{ path: string }> => {
  // DELETE carries a body here because the path is a payload, not an identifier
  // in the URL — this matches the backend route's validate(deleteEntrySchema).
  const { data } = await apiClient.delete<ApiSuccess<{ path: string }>>(
    `/projects/${projectId}/files`,
    { data: { path } }
  );
  return data.data;
};

// ─── Editor helpers ──────────────────────────────────────────────────────────

/** Map a file extension to a Monaco language id (SRS Module 7). */
export const languageForPath = (path: string): string => {
  const extension = path.includes('.') ? path.split('.').pop()!.toLowerCase() : '';

  const byExtension: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    c: 'c',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    sql: 'sql',
    xml: 'xml',
  };

  return byExtension[extension] ?? 'plaintext';
};
