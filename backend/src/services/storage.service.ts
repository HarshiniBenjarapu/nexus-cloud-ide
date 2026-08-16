import fs from 'fs/promises';
import path from 'path';
import { buildTemplateFiles } from '../templates';
import { ProjectTemplate } from '../types/templates';
import { resolveWithinRoot, normalizeRelativePath } from '../utils/pathGuard';

/**
 * Development file storage (SRS 5.8).
 *
 * Project source files live on the local file system under
 *   backend/storage/projects/<workspaceId>/<projectId>/
 * MongoDB (Project / ProjectFile) keeps only references and metadata (SRS 5.7).
 *
 * Every public method resolves the target path through resolveWithinRoot and
 * re-verifies containment before touching the disk — this is the second,
 * independent layer of path-traversal protection after request validation.
 */

const STORAGE_ROOT = path.resolve(__dirname, '..', '..', 'storage', 'projects');

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export const getProjectRoot = (workspaceId: string, projectId: string): string =>
  path.join(STORAGE_ROOT, String(workspaceId), String(projectId));

// ─── Scaffolding ─────────────────────────────────────────────────────────────

/** Create a project directory and write its template scaffold. */
export const createProjectStorage = async (
  workspaceId: string,
  projectId: string,
  template: ProjectTemplate,
  projectName: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  await fs.mkdir(root, { recursive: true });

  for (const file of buildTemplateFiles(template, projectName)) {
    const target = resolveWithinRoot(root, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, 'utf8');
  }
};

/**
 * Copy an entire project's files to a new project (SRS Module 4 — Duplicate).
 * The destination must not already exist.
 */
export const copyProjectStorage = async (
  workspaceId: string,
  sourceProjectId: string,
  targetProjectId: string
): Promise<void> => {
  const from = getProjectRoot(workspaceId, sourceProjectId);
  const to = getProjectRoot(workspaceId, targetProjectId);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.cp(from, to, { recursive: true, errorOnExist: true, force: false });
};

/** Remove a project's files entirely (used when a project is hard-deleted). */
export const deleteProjectStorage = async (
  workspaceId: string,
  projectId: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  await fs.rm(root, { recursive: true, force: true });
};

// ─── Tree ────────────────────────────────────────────────────────────────────

/**
 * Walk the on-disk tree. Absolute paths never leak into the response.
 * A project whose directory is missing lists as empty rather than throwing —
 * metadata in MongoDB is the authority on whether the project itself exists.
 */
export const listFiles = async (
  workspaceId: string,
  projectId: string
): Promise<FileNode[]> => {
  const root = getProjectRoot(workspaceId, projectId);

  const walk = async (dirPath: string, relativeDir: string): Promise<FileNode[]> => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    entries.sort((a, b) => {
      // Folders first, then case-insensitive by name — matches common IDE UX
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const nodes: FileNode[] = [];
    for (const entry of entries) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'folder',
          children: await walk(path.join(dirPath, entry.name), relativePath),
        });
      } else {
        nodes.push({ name: entry.name, path: relativePath, type: 'file' });
      }
    }
    return nodes;
  };

  try {
    return await walk(root, '');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
};

// ─── Content ─────────────────────────────────────────────────────────────────

export const readFileContent = async (
  workspaceId: string,
  projectId: string,
  relativePath: string
): Promise<string> => {
  const root = getProjectRoot(workspaceId, projectId);
  const target = resolveWithinRoot(root, relativePath);
  return fs.readFile(target, 'utf8');
};

export const writeFileContent = async (
  workspaceId: string,
  projectId: string,
  relativePath: string,
  content: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  const target = resolveWithinRoot(root, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, 'utf8');
};

export const createFile = async (
  workspaceId: string,
  projectId: string,
  relativePath: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  const target = resolveWithinRoot(root, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  // writeFile with the 'wx' flag fails if the file already exists
  await fs.writeFile(target, '', { encoding: 'utf8', flag: 'wx' });
};

export const createFolder = async (
  workspaceId: string,
  projectId: string,
  relativePath: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  const target = resolveWithinRoot(root, relativePath);
  // recursive:false so an existing directory is reported as a conflict
  await fs.mkdir(target);
};

export const renamePath = async (
  workspaceId: string,
  projectId: string,
  oldRelativePath: string,
  newRelativePath: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  const from = resolveWithinRoot(root, oldRelativePath);
  const to = resolveWithinRoot(root, newRelativePath);
  await fs.rename(from, to);
};

export const deletePath = async (
  workspaceId: string,
  projectId: string,
  relativePath: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  const target = resolveWithinRoot(root, relativePath);
  await fs.rm(target, { recursive: true, force: true });
};

export const copyPath = async (
  workspaceId: string,
  projectId: string,
  sourceRelativePath: string,
  targetRelativePath: string
): Promise<void> => {
  const root = getProjectRoot(workspaceId, projectId);
  const from = resolveWithinRoot(root, sourceRelativePath);
  const to = resolveWithinRoot(root, targetRelativePath);
  await fs.cp(from, to, { recursive: true });
};

/** Absolute on-disk path for an untrusted relative path — used by stats. */
export const resolvePath = (
  workspaceId: string,
  projectId: string,
  relativePath: string
): string => resolveWithinRoot(getProjectRoot(workspaceId, projectId), relativePath);

export interface PathStat {
  type: 'file' | 'folder';
  size: number;
  modifiedAt: Date;
}

/**
 * Size and last-modified time for a path (SRS 6.10 metadata).
 * Returns null when the path does not exist, so callers can distinguish
 * "missing" from "unreadable" without catching ENOENT themselves.
 */
export const statPath = async (
  workspaceId: string,
  projectId: string,
  relativePath: string
): Promise<PathStat | null> => {
  const target = resolvePath(workspaceId, projectId, relativePath);
  try {
    const stats = await fs.stat(target);
    return {
      type: stats.isDirectory() ? 'folder' : 'file',
      size: stats.isDirectory() ? 0 : stats.size,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
};

/** Whether a project-relative path exists on disk. */
export const pathExists = async (
  workspaceId: string,
  projectId: string,
  relativePath: string
): Promise<boolean> => (await statPath(workspaceId, projectId, relativePath)) !== null;

export { normalizeRelativePath };
