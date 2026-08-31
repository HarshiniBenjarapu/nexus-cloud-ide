import path from 'path';
import { Response, NextFunction } from 'express';
import { ProjectFile } from '../models/ProjectFile';
import { AuthorizedRequest } from '../middleware/authorize.middleware';
import { FileNodeDTO, FileContentDTO } from '../types/index';
import { normalizeRelativePath, assertValidName } from '../utils/pathGuard';
import * as storage from '../services/storage.service';
import { getDefaultFileBoilerplate } from '../templates';

/**
 * Module 6 — File Explorer.
 *
 * The on-disk tree is the source of truth for structure; the ProjectFile
 * collection mirrors it so metadata (size, owner, last modified) can be queried
 * without walking the disk (SRS 6.10). Disk is written first — a metadata row
 * with no file behind it would be worse than a file with stale metadata.
 */

/** Project scope for every storage and metadata call in this controller. */
const scope = (req: AuthorizedRequest) => ({
  workspaceId: String(req.project!.workspaceId),  
  projectId: String(req.project!._id),
});

const parentOf = (relativePath: string): string => {
  const parent = path.posix.dirname(relativePath);
  return parent === '.' ? '' : parent;
};

const joinPath = (parent: string, name: string): string =>
  parent ? `${parent}/${name}` : name; 

/** Keep the ProjectFile row for a path in step with what is now on disk. */ 
const syncMetadata = async (
  req: AuthorizedRequest,  
  relativePath: string,
  type: 'file' | 'folder',
  content?: string
): Promise<void> => {
  const { workspaceId, projectId } = scope(req);
  const stat = await storage.statPath(workspaceId, projectId, relativePath);

  const updateFields: any = {
    name: path.posix.basename(relativePath),
    parentFolder: parentOf(relativePath),
    type,
    extension:
      type === 'file' ? path.posix.extname(relativePath).replace(/^\./, '') : '',
    size: stat?.size ?? 0,
    lastModifiedBy: req.user._id,
  };

  if (content !== undefined) {
    updateFields.content = content;
  }

  await ProjectFile.findOneAndUpdate(
    { projectId: req.project!._id, path: relativePath },
    {
      // $set and $setOnInsert must not be mixed with plain fields in one update
      $set: updateFields,
      $setOnInsert: {
        projectId: req.project!._id,
        path: relativePath,
        createdBy: req.user._id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/** Drop metadata for a path and everything beneath it. */
const dropMetadata = async (
  req: AuthorizedRequest,
  relativePath: string
): Promise<void> => {
  await ProjectFile.deleteMany({
    projectId: req.project!._id,
    $or: [{ path: relativePath }, { path: new RegExp(`^${escapeRegex(relativePath)}/`) }],
  });
};

const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Translate a Node fs error into the response the client should see. */
const fsErrorStatus = (error: unknown): { status: number; message: string } | null => {
  const code = (error as NodeJS.ErrnoException).code;
  switch (code) {
    case 'ENOENT':
      return { status: 404, message: 'That file or folder does not exist.' };
    case 'EEXIST':
      return { status: 409, message: 'A file or folder with that name already exists.' };
    case 'ENOTDIR':
      return { status: 400, message: 'That path is not a folder.' };
    case 'EISDIR':
      return { status: 400, message: 'That path is a folder, not a file.' };
    case 'ENOTEMPTY':
      return { status: 409, message: 'That folder is not empty.' };
    default:
      return null;
  }
};

const handle = async (
  res: Response,
  next: NextFunction,
  work: () => Promise<void>
): Promise<void> => {
  try {
    await work();
  } catch (error) {
    const mapped = fsErrorStatus(error);
    if (mapped) {
      res.status(mapped.status).json({ success: false, message: mapped.message });
      return;
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:projectId/files
// The full nested tree (SRS Module 6 — Nested Folders).
// Requires: organization membership (any role, including Viewer).
// ─────────────────────────────────────────────────────────────────────────────
export const getFileTree = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    await storage.ensureProjectStorage(
      workspaceId,
      projectId,
      req.project!.template,
      req.project!.name,
      req.user._id
    );
    const tree: FileNodeDTO[] = await storage.listFiles(workspaceId, projectId);

    res.status(200).json({
      success: true,
      message: 'File tree retrieved.',
      data: { tree, memberRole: req.membership!.role },
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:projectId/files/content?path=…
// Requires: organization membership (any role).
// ─────────────────────────────────────────────────────────────────────────────
export const getFileContent = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    const relativePath = normalizeRelativePath(String(req.query.path));

    if (!relativePath) {
      res.status(400).json({ success: false, message: 'A file path is required.' });
      return;
    }

    await storage.ensureProjectStorage(
      workspaceId,
      projectId,
      req.project!.template,
      req.project!.name,
      req.user._id
    );

    let stat = await storage.statPath(workspaceId, projectId, relativePath);
    if (!stat) {
      // Check if MongoDB has this file and restore it to disk
      const dbFile = await ProjectFile.findOne({ projectId: req.project!._id, path: relativePath });
      if (dbFile && dbFile.type === 'file') {
        await storage.writeFileContent(workspaceId, projectId, relativePath, dbFile.content ?? '');
        stat = await storage.statPath(workspaceId, projectId, relativePath);
      }
    }

    if (!stat) {
      res.status(404).json({ success: false, message: 'That file does not exist.' });
      return;
    }
    if (stat.type === 'folder') {
      res.status(400).json({ success: false, message: 'That path is a folder, not a file.' });
      return;
    }

    const content = await storage.readFileContent(workspaceId, projectId, relativePath);

    const body: FileContentDTO = {
      path: relativePath,
      content,
      size: stat.size,
      updatedAt: stat.modifiedAt.toISOString(),
    };

    res.status(200).json({ success: true, message: 'File retrieved.', data: body });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:projectId/files/content
// Save an existing file (SRS Module 7 — Auto Save writes through here).
// Requires: Developer or above (SRS 2.7 — "edit code").
// ─────────────────────────────────────────────────────────────────────────────
export const writeFile = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    const relativePath = normalizeRelativePath(req.body.path);
    const { content } = req.body;

    if (!relativePath) {
      res.status(400).json({ success: false, message: 'A file path is required.' });
      return;
    }

    // Saving must not create a new file at an arbitrary path — creation goes
    // through POST /files so the explorer stays authoritative.
    let stat = await storage.statPath(workspaceId, projectId, relativePath);
    if (!stat) {
      const dbFile = await ProjectFile.findOne({ projectId: req.project!._id, path: relativePath });
      if (dbFile) {
        await storage.writeFileContent(workspaceId, projectId, relativePath, content);
        stat = await storage.statPath(workspaceId, projectId, relativePath);
      }
    }

    if (!stat) {
      res.status(404).json({ success: false, message: 'That file does not exist.' });
      return;
    }
    if (stat.type === 'folder') {
      res.status(400).json({ success: false, message: 'That path is a folder, not a file.' });
      return;
    }

    await storage.writeFileContent(workspaceId, projectId, relativePath, content);
    await syncMetadata(req, relativePath, 'file', content);

    const updated = await storage.statPath(workspaceId, projectId, relativePath);

    res.status(200).json({
      success: true,
      message: 'File saved.',
      data: {
        path: relativePath,
        size: updated?.size ?? 0,
        updatedAt: updated?.modifiedAt.toISOString() ?? null,
      },
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/files
// Create a file or folder (SRS Module 6 — Create File / Create Folder).
// Requires: Developer or above.
// ─────────────────────────────────────────────────────────────────────────────
export const createEntry = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    const { type, content } = req.body;

    const parentPath = normalizeRelativePath(req.body.parentPath ?? '');
    const name = assertValidName(req.body.name);
    const relativePath = normalizeRelativePath(joinPath(parentPath, name));

    // The parent must exist and be a folder, or the new entry would silently
    // create intermediate directories the user never asked for.
    if (parentPath) {
      const parentStat = await storage.statPath(workspaceId, projectId, parentPath);
      if (!parentStat) {
        res.status(404).json({ success: false, message: 'That folder does not exist.' });
        return;
      }
      if (parentStat.type !== 'folder') {
        res.status(400).json({ success: false, message: 'The parent path is not a folder.' });
        return;
      }
    }

    if (await storage.pathExists(workspaceId, projectId, relativePath)) {
      res.status(409).json({
        success: false,
        message: 'A file or folder with that name already exists.',
      });
      return;
    }

    if (type === 'folder') {
      await storage.createFolder(workspaceId, projectId, relativePath);
      await syncMetadata(req, relativePath, 'folder');
    } else {
      await storage.createFile(workspaceId, projectId, relativePath);
      const initialContent = content !== undefined && content !== null && content !== ''
        ? content
        : getDefaultFileBoilerplate(name);
      await storage.writeFileContent(workspaceId, projectId, relativePath, initialContent);
      await syncMetadata(req, relativePath, 'file', initialContent);
    }

    res.status(201).json({
      success: true,
      message: `${type === 'folder' ? 'Folder' : 'File'} created.`,
      data: { path: relativePath, name, type },
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/files/rename
// Requires: Developer or above (SRS Module 6 — Rename).
// ─────────────────────────────────────────────────────────────────────────────
export const renameEntry = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    const relativePath = normalizeRelativePath(req.body.path);
    const newName = assertValidName(req.body.newName);

    if (!relativePath) {
      res.status(400).json({ success: false, message: 'The project root cannot be renamed.' });
      return;
    }

    const stat = await storage.statPath(workspaceId, projectId, relativePath);
    if (!stat) {
      res.status(404).json({ success: false, message: 'That file or folder does not exist.' });
      return;
    }

    const targetPath = normalizeRelativePath(joinPath(parentOf(relativePath), newName));

    if (targetPath === relativePath) {
      res.status(200).json({
        success: true,
        message: 'File renamed.',
        data: { path: relativePath, name: newName, type: stat.type },
      });
      return;
    }

    // fs.rename overwrites an existing target, so refuse the collision first
    if (await storage.pathExists(workspaceId, projectId, targetPath)) {
      res.status(409).json({
        success: false,
        message: 'A file or folder with that name already exists.',
      });
      return;
    }

    await storage.renamePath(workspaceId, projectId, relativePath, targetPath);

    // Rewrite metadata for the entry and, for a folder, everything under it
    await dropMetadata(req, relativePath);
    await syncMetadata(req, targetPath, stat.type);
    if (stat.type === 'folder') {
      await reindexFolder(req, targetPath);
    }

    res.status(200).json({
      success: true,
      message: `${stat.type === 'folder' ? 'Folder' : 'File'} renamed.`,
      data: { path: targetPath, name: newName, type: stat.type },
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/files/duplicate
// Requires: Developer or above (SRS Module 6 — Duplicate).
// ─────────────────────────────────────────────────────────────────────────────
export const duplicateEntry = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    const relativePath = normalizeRelativePath(req.body.path);

    if (!relativePath) {
      res.status(400).json({ success: false, message: 'The project root cannot be duplicated.' });
      return;
    }

    const stat = await storage.statPath(workspaceId, projectId, relativePath);
    if (!stat) {
      res.status(404).json({ success: false, message: 'That file or folder does not exist.' });
      return;
    }

    const parent = parentOf(relativePath);
    const targetPath = req.body.newName
      ? normalizeRelativePath(joinPath(parent, assertValidName(req.body.newName)))
      : await deriveCopyPath(workspaceId, projectId, relativePath, stat.type);

    if (await storage.pathExists(workspaceId, projectId, targetPath)) {
      res.status(409).json({
        success: false,
        message: 'A file or folder with that name already exists.',
      });
      return;
    }

    await storage.copyPath(workspaceId, projectId, relativePath, targetPath);

    await syncMetadata(req, targetPath, stat.type);
    if (stat.type === 'folder') {
      await reindexFolder(req, targetPath);
    }

    res.status(201).json({
      success: true,
      message: `${stat.type === 'folder' ? 'Folder' : 'File'} duplicated.`,
      data: { path: targetPath, name: path.posix.basename(targetPath), type: stat.type },
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/files
// Requires: Developer or above (SRS Module 6 — Delete).
// ─────────────────────────────────────────────────────────────────────────────
export const deleteEntry = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await handle(res, next, async () => {
    const { workspaceId, projectId } = scope(req);
    const relativePath = normalizeRelativePath(req.body.path);

    if (!relativePath) {
      res.status(400).json({ success: false, message: 'The project root cannot be deleted.' });
      return;
    }

    const stat = await storage.statPath(workspaceId, projectId, relativePath);
    if (!stat) {
      res.status(404).json({ success: false, message: 'That file or folder does not exist.' });
      return;
    }

    await storage.deletePath(workspaceId, projectId, relativePath);
    await dropMetadata(req, relativePath);

    res.status(200).json({
      success: true,
      message: `${stat.type === 'folder' ? 'Folder' : 'File'} deleted.`,
      data: { path: relativePath },
    });
  });
};

// ─── Helpers that need storage access ────────────────────────────────────────

/** Pick "name copy.ext", then "name copy 2.ext", … for a duplicate. */
const deriveCopyPath = async (
  workspaceId: string,
  projectId: string,
  relativePath: string,
  type: 'file' | 'folder'
): Promise<string> => {
  const parent = parentOf(relativePath);
  const base = path.posix.basename(relativePath);
  const extension = type === 'file' ? path.posix.extname(base) : '';
  const stem = extension ? base.slice(0, -extension.length) : base;

  for (let suffix = 1; suffix < 100; suffix += 1) {
    const label = suffix === 1 ? 'copy' : `copy ${suffix}`;
    const candidate = joinPath(parent, `${stem} ${label}${extension}`);
    if (!(await storage.pathExists(workspaceId, projectId, candidate))) {
      return normalizeRelativePath(candidate);
    }
  }

  throw Object.assign(new Error('Could not derive an unused name for the copy.'), {
    statusCode: 409,
  });
};

/** Re-record metadata for every descendant of a folder after a move or copy. */
const reindexFolder = async (
  req: AuthorizedRequest,
  folderPath: string
): Promise<void> => {
  const { workspaceId, projectId } = scope(req);
  const tree = await storage.listFiles(workspaceId, projectId);

  const collect = (nodes: FileNodeDTO[], out: FileNodeDTO[] = []): FileNodeDTO[] => {
    for (const node of nodes) {
      out.push(node);
      if (node.children) collect(node.children, out);
    }
    return out;
  };

  const descendants = collect(tree).filter((node) => node.path.startsWith(`${folderPath}/`));

  for (const node of descendants) {
    await syncMetadata(req, node.path, node.type);
  }
};
