import { Response, NextFunction } from 'express';
import { Workspace } from '../models/Workspace';
import { AuthorizedRequest } from '../middleware/authorize.middleware';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organizations/:orgId/workspaces
// Requires: organization membership (any role).
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkspaces = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workspaces = await Workspace.find({
      organizationId: req.organization!._id,
      deletedAt: null,
    })
      .populate('createdBy', 'fullName username avatar')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Workspaces retrieved.',
      data: { workspaces },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organizations/:orgId/workspaces
// Requires: Owner or Admin ("create workspaces", SRS 2.7).
// ─────────────────────────────────────────────────────────────────────────────
export const createWorkspace = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, terminalEnabled, aiEnabled } = req.body;

    const workspace = await Workspace.create({
      // Taken from the authorized organization, never from the request body
      organizationId: req.organization!._id,
      name: name.trim(),
      description: description || '',
      terminalEnabled: terminalEnabled !== undefined ? terminalEnabled : true,
      aiEnabled: aiEnabled !== undefined ? aiEnabled : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Workspace "${workspace.name}" created successfully.`,
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId
// Requires: membership of the owning organization (any role).
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkspace = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Resolved and access-checked by authorizeWorkspace
    const workspace = await req.workspace!.populate('createdBy', 'fullName username avatar');

    res.status(200).json({
      success: true,
      message: 'Workspace retrieved.',
      data: { workspace: workspace.toObject(), memberRole: req.membership!.role },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId
// Requires: Owner or Admin ("manage workspaces", SRS 2.7).
// ─────────────────────────────────────────────────────────────────────────────
export const updateWorkspace = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, terminalEnabled, aiEnabled } = req.body;

    // Only apply fields the client actually sent
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (terminalEnabled !== undefined) updates.terminalEnabled = terminalEnabled;
    if (aiEnabled !== undefined) updates.aiEnabled = aiEnabled;

    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.workspace!._id, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Workspace updated.',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId
// Requires: Owner or Admin ("delete workspaces", SRS 2.7).
// Soft delete (SRS 6.21) — the record is retained for recovery.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteWorkspace = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workspace = req.workspace!;

    workspace.deletedAt = new Date();
    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
