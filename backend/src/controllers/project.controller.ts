import { Response, NextFunction } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import { Project, IProject } from '../models/Project';
import { ProjectFile } from '../models/ProjectFile';
import { AuthorizedRequest } from '../middleware/authorize.middleware';
import { TEMPLATE_LANGUAGE } from '../types/templates';
import {
  createProjectStorage,
  copyProjectStorage,
  deleteProjectStorage,
} from '../services/storage.service';

/**
 * Module 4 — Project Management.
 *
 * MongoDB holds project metadata; the source files live on disk under
 * services/storage.service (SRS 5.7 / 5.8). Both must move together, so every
 * handler that writes to disk is careful about the order of operations and
 * unwinds its own partial work on failure.
 */

/** Escape a user-supplied search term before it reaches a RegExp. */
const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pick a project name that is free within the workspace, e.g. "App (copy) 2". */
const findAvailableName = async (
  workspaceId: mongoose.Types.ObjectId,
  preferred: string
): Promise<string> => {
  const base = preferred.slice(0, 80);

  if (!(await Project.exists({ workspaceId, name: base, deletedAt: null }))) {
    return base;
  }

  for (let suffix = 2; suffix < 100; suffix += 1) {
    // Keep the result inside the 80-character limit the schema enforces
    const candidate = `${base.slice(0, 80 - String(suffix).length - 1)} ${suffix}`;
    if (!(await Project.exists({ workspaceId, name: candidate, deletedAt: null }))) {
      return candidate;
    }
  }

  throw Object.assign(new Error('Could not derive an unused project name.'), {
    statusCode: 409,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/projects
// Requires: Developer or above (SRS 2.7 — "create projects").
// ─────────────────────────────────────────────────────────────────────────────
export const createProject = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let created: IProject | null = null;

  try {
    const { name, description, template, visibility, gitEnabled, deploymentEnabled } = req.body;
    const workspace = req.workspace!;

    created = await Project.create({
      // Taken from the authorized workspace, never from the request body
      workspaceId: workspace._id,
      name: name.trim(),
      description: description || '',
      template,
      language: TEMPLATE_LANGUAGE[template as keyof typeof TEMPLATE_LANGUAGE] ?? '',
      visibility: visibility || 'private',
      gitEnabled: gitEnabled ?? false,
      deploymentEnabled: deploymentEnabled ?? false,
      createdBy: req.user._id,
    });

    // Scaffold on disk only once the metadata row exists, so the directory is
    // always named after a project that is really there.
    await createProjectStorage(
      String(workspace._id),
      String(created._id),
      template,
      created.name
    );

    res.status(201).json({
      success: true,
      message: `Project "${created.name}" created successfully.`,
      data: { project: created },
    });
  } catch (error) {
    // If scaffolding failed we would otherwise leave a project with no files.
    if (created) {
      await Project.deleteOne({ _id: created._id }).catch(() => undefined);
      await deleteProjectStorage(
        String(created.workspaceId),
        String(created._id)
      ).catch(() => undefined);
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/projects
// Requires: organization membership (any role, including Viewer).
// Supports search, filtering and paging (SRS Module 4 — Search Projects).
// ─────────────────────────────────────────────────────────────────────────────
export const getProjects = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // validate(listProjectsQuerySchema, 'query') has already coerced and
    // defaulted these, so the shape is known even though Express types it loosely.
    const { search, template, favorite, archived, sort, page, limit } =
      req.query as unknown as {
        search?: string;
        template?: string;
        favorite?: boolean;
        archived: boolean;
        sort: 'recent' | 'name' | 'created';
        page: number;
        limit: number;
      };

    const filter: FilterQuery<IProject> = {
      workspaceId: req.workspace!._id,
      deletedAt: null,
      isArchived: archived,
    };

    if (search) {
      const term = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: term }, { description: term }];
    }
    if (template) filter.template = template;
    if (favorite !== undefined) filter.isFavorite = favorite;

    const sortOrder = {
      recent: { updatedAt: -1 as const },
      name: { name: 1 as const },
      created: { createdAt: -1 as const },
    }[sort];

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('createdBy', 'fullName username avatar')
        .sort(sortOrder)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Projects retrieved.',
      data: {
        projects,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        memberRole: req.membership!.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:projectId
// Requires: organization membership (any role).
// ─────────────────────────────────────────────────────────────────────────────
export const getProject = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Resolved and access-checked by authorizeProject
    const project = await req.project!.populate('createdBy', 'fullName username avatar');

    res.status(200).json({
      success: true,
      message: 'Project retrieved.',
      data: { project: project.toObject(), memberRole: req.membership!.role },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId
// Rename and settings (SRS Module 4 — Rename Project, Favorite Project).
// Requires: Developer or above.
// ─────────────────────────────────────────────────────────────────────────────
export const updateProject = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, visibility, gitEnabled, deploymentEnabled, isFavorite } = req.body;

    // Only apply fields the client actually sent
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (visibility !== undefined) updates.visibility = visibility;
    if (gitEnabled !== undefined) updates.gitEnabled = gitEnabled;
    if (deploymentEnabled !== undefined) updates.deploymentEnabled = deploymentEnabled;
    if (isFavorite !== undefined) updates.isFavorite = isFavorite;

    const project = await Project.findOneAndUpdate(
      { _id: req.project!._id, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    // Renaming changes metadata only — the storage directory is keyed by id,
    // so no files move and open editors keep working.
    res.status(200).json({
      success: true,
      message: 'Project updated.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/duplicate
// Requires: Developer or above (SRS Module 4 — Duplicate Project).
// ─────────────────────────────────────────────────────────────────────────────
export const duplicateProject = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let copy: IProject | null = null;

  try {
    const source = req.project!;
    const requestedName: string | undefined = req.body.name;

    const targetName = await findAvailableName(
      source.workspaceId,
      requestedName?.trim() || `${source.name} (copy)`
    );

    copy = await Project.create({
      workspaceId: source.workspaceId,
      name: targetName,
      description: source.description,
      template: source.template,
      language: source.language,
      visibility: source.visibility,
      gitEnabled: source.gitEnabled,
      deploymentEnabled: source.deploymentEnabled,
      // A duplicate starts unfavorited and active regardless of the source
      isFavorite: false,
      isArchived: false,
      createdBy: req.user._id,
    });

    await copyProjectStorage(
      String(source.workspaceId),
      String(source._id),
      String(copy._id)
    );

    // Clone the file metadata rows so listings match disk immediately
    const sourceFiles = await ProjectFile.find({ projectId: source._id }).lean();
    if (sourceFiles.length > 0) {
      await ProjectFile.insertMany(
        sourceFiles.map((file) => ({
          projectId: copy!._id,
          name: file.name,
          path: file.path,
          parentFolder: file.parentFolder,
          type: file.type,
          extension: file.extension,
          size: file.size,
          createdBy: req.user._id,
          lastModifiedBy: null,
        }))
      );
    }

    res.status(201).json({
      success: true,
      message: `Project duplicated as "${copy.name}".`,
      data: { project: copy },
    });
  } catch (error) {
    if (copy) {
      await Project.deleteOne({ _id: copy._id }).catch(() => undefined);
      await ProjectFile.deleteMany({ projectId: copy._id }).catch(() => undefined);
      await deleteProjectStorage(
        String(copy.workspaceId),
        String(copy._id)
      ).catch(() => undefined);
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/archive  |  /restore
// Requires: Developer or above (SRS Module 4 — Archive / Restore Project).
// ─────────────────────────────────────────────────────────────────────────────
const setArchived = (archived: boolean) => {
  return async (
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const project = req.project!;

      if (project.isArchived === archived) {
        res.status(409).json({
          success: false,
          message: archived
            ? 'This project is already archived.'
            : 'This project is not archived.',
        });
        return;
      }

      project.isArchived = archived;
      await project.save();

      res.status(200).json({
        success: true,
        message: archived ? 'Project archived.' : 'Project restored.',
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  };
};

export const archiveProject = setArchived(true);
export const restoreProject = setArchived(false);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId
// Requires: Maintainer or above (SRS 2.7 — project maintenance).
// Soft delete (SRS 6.21): files are retained on disk so the project can be
// recovered. Purging storage is a separate lifecycle job, not part of V1.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProject = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const project = req.project!;

    project.deletedAt = new Date();
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
