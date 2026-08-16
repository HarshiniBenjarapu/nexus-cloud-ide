import { Router } from 'express';
import {
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.controller';
import { getProjects, createProject } from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeWorkspace, restrictTo } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateWorkspaceSchema,
  workspaceIdParamSchema,
} from '../validators/workspace.validator';
import {
  createProjectSchema,
  listProjectsQuerySchema,
} from '../validators/project.validator';
import { WORKSPACE_MANAGERS } from '../types/roles';
import { PROJECT_CONTRIBUTORS } from '../types/templates';

const router = Router();

// Identity…
router.use(protect);

// …then authority: authorizeWorkspace resolves the workspace's organization and
// verifies the caller is a member of it.
const workspaceScoped = [
  validate(workspaceIdParamSchema, 'params'),
  authorizeWorkspace,
];

router.get('/:workspaceId', workspaceScoped, getWorkspace);

router.patch(
  '/:workspaceId',
  workspaceScoped,
  restrictTo(...WORKSPACE_MANAGERS),
  validate(updateWorkspaceSchema),
  updateWorkspace
);

router.delete(
  '/:workspaceId',
  workspaceScoped,
  restrictTo(...WORKSPACE_MANAGERS),
  deleteWorkspace
);

// ─── Nested project routes under a workspace (Module 4) ──────────────────────
// Listing is open to any member; creating requires Developer or above (SRS 2.7).
router.get(
  '/:workspaceId/projects',
  workspaceScoped,
  validate(listProjectsQuerySchema, 'query'),
  getProjects
);

router.post(
  '/:workspaceId/projects',
  workspaceScoped,
  restrictTo(...PROJECT_CONTRIBUTORS),
  validate(createProjectSchema),
  createProject
);

export default router;
