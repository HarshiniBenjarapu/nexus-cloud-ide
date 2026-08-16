import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Organization, IOrganization } from '../models/Organization';
import { OrganizationMember, IOrganizationMember } from '../models/OrganizationMember';
import { Workspace, IWorkspace } from '../models/Workspace';
import { Project, IProject } from '../models/Project';
import { AuthRequest } from './auth.middleware';
import { OrgRole } from '../types/roles';

/**
 * Authorization middleware (SRS 4.11 / 5.10).
 *
 * `protect` establishes *identity*. These middlewares establish *authority*:
 * they resolve the caller's membership in the organization that owns the
 * requested resource and reject non-members before any controller runs.
 */

export interface AuthorizedRequest extends AuthRequest {
  organization?: IOrganization;
  membership?: IOrganizationMember;
  workspace?: IWorkspace;
  project?: IProject;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve membership for routes carrying :orgId
// ─────────────────────────────────────────────────────────────────────────────
export const authorizeOrganization = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;

    if (!Types.ObjectId.isValid(orgId)) {
      res.status(400).json({ success: false, message: 'Invalid organization ID format.' });
      return;
    }

    const organization = await Organization.findOne({ _id: orgId, deletedAt: null });
    if (!organization) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    const membership = await OrganizationMember.findOne({
      organizationId: organization._id,
      userId: req.user._id,
    });

    if (!membership) {
      // Deliberately identical wording to the "not found" case above so that a
      // non-member cannot probe which organization IDs exist.
      res.status(403).json({
        success: false,
        message: 'You do not have access to this organization.',
      });
      return;
    }

    req.organization = organization;
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Resolve membership for routes carrying :workspaceId
// (the workspace tells us which organization to check against)
// ─────────────────────────────────────────────────────────────────────────────
export const authorizeWorkspace = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { workspaceId } = req.params;

    if (!Types.ObjectId.isValid(workspaceId)) {
      res.status(400).json({ success: false, message: 'Invalid workspace ID format.' });
      return;
    }

    const workspace = await Workspace.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    const organization = await Organization.findOne({
      _id: workspace.organizationId,
      deletedAt: null,
    });
    if (!organization) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    const membership = await OrganizationMember.findOne({
      organizationId: organization._id,
      userId: req.user._id,
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace.',
      });
      return;
    }

    req.workspace = workspace;
    req.organization = organization;
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Resolve membership for routes carrying :projectId
// (project → workspace → organization → membership)
// ─────────────────────────────────────────────────────────────────────────────
export const authorizeProject = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!Types.ObjectId.isValid(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID format.' });
      return;
    }

    // Archived projects still resolve — restoring one requires reaching it.
    // Soft-deleted projects do not (SRS 6.21).
    const project = await Project.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const workspace = await Workspace.findOne({
      _id: project.workspaceId,
      deletedAt: null,
    });
    if (!workspace) {
      // The owning workspace is gone, so the project is unreachable in practice.
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const organization = await Organization.findOne({
      _id: workspace.organizationId,
      deletedAt: null,
    });
    if (!organization) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const membership = await OrganizationMember.findOne({
      organizationId: organization._id,
      userId: req.user._id,
    });

    if (!membership) {
      // Same wording as the 404 path above would leak nothing extra, but a
      // distinct 403 is correct here: the resource exists and access is denied.
      res.status(403).json({
        success: false,
        message: 'You do not have access to this project.',
      });
      return;
    }

    req.project = project;
    req.workspace = workspace;
    req.organization = organization;
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Role gate — must run after authorizeOrganization / authorizeWorkspace.
//
// This replaces the former auth.middleware `restrictTo`, which read the global
// User.role field. Organization membership is now the only source of authority.
// ─────────────────────────────────────────────────────────────────────────────
export const restrictTo = (...roles: OrgRole[]) => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    if (!req.membership) {
      // A programming error rather than a client error: the guard was mounted
      // without a preceding membership resolver. Fail closed.
      res.status(500).json({
        success: false,
        message: 'Authorization could not be resolved for this request.',
      });
      return;
    }

    if (!roles.includes(req.membership.role)) {
      res.status(403).json({
        success: false,
        message: `Access forbidden. This action requires one of the following organization roles: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };
};
