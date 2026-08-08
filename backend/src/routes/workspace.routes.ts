import { Router } from 'express';
import {
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeWorkspace, restrictTo } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateWorkspaceSchema,
  workspaceIdParamSchema,
} from '../validators/workspace.validator';
import { WORKSPACE_MANAGERS } from '../types/roles';

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

export default router;
