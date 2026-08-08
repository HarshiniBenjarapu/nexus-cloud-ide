import { Response, NextFunction } from 'express';
import { Workspace } from '../models/Workspace';
import { OrganizationMember } from '../models/OrganizationMember';
import { AuthRequest } from '../middleware/auth.middleware';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organizations/:orgId/workspaces
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkspaces = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    const workspaces = await Workspace.find({ organizationId: orgId })
      .populate('createdBy', 'fullName username avatar')
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
// ─────────────────────────────────────────────────────────────────────────────
export const createWorkspace = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { name, description, terminalEnabled, aiEnabled } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Workspace name is required.' });
      return;
    }

    const workspace = await Workspace.create({
      organizationId: orgId,
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
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkspace = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId)
      .populate('createdBy', 'fullName username avatar')
      .lean();

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Workspace retrieved.', data: { workspace } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/workspaces/:workspaceId
// ─────────────────────────────────────────────────────────────────────────────
export const updateWorkspace = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { name, description, terminalEnabled, aiEnabled } = req.body;

    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { name, description, terminalEnabled, aiEnabled },
      { new: true, runValidators: true }
    );

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Workspace updated.', data: { workspace } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/workspaces/:workspaceId
// ─────────────────────────────────────────────────────────────────────────────
export const deleteWorkspace = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    // Only the creator or org Owner/Admin can delete
    if (String(workspace.createdBy) !== String(req.user._id)) {
      res.status(403).json({ success: false, message: 'Only the workspace creator can delete it.' });
      return;
    }

    await Workspace.findByIdAndDelete(workspaceId);
    res.status(200).json({ success: true, message: 'Workspace deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
