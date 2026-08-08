import { Router } from 'express';
import {
  getMyOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  inviteMember,
} from '../controllers/organization.controller';
import {
  getWorkspaces,
  createWorkspace,
} from '../controllers/workspace.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All org routes require authentication
router.use(protect);

router.get('/', getMyOrganizations);
router.post('/', createOrganization);
router.get('/:orgId', getOrganization);
router.patch('/:orgId', updateOrganization);
router.delete('/:orgId', deleteOrganization);
router.post('/:orgId/invite', inviteMember);

// Nested workspace routes under an org
router.get('/:orgId/workspaces', getWorkspaces);
router.post('/:orgId/workspaces', createWorkspace);

export default router;
