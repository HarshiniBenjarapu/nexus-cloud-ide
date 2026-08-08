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
import { authorizeOrganization, restrictTo } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  orgIdParamSchema,
} from '../validators/organization.validator';
import { createWorkspaceSchema } from '../validators/workspace.validator';
import { ORG_MANAGERS, WORKSPACE_MANAGERS } from '../types/roles';

const router = Router();

// Every organization route requires authentication (identity)…
router.use(protect);

// ─── Routes not scoped to a single organization ──────────────────────────────
router.get('/', getMyOrganizations);
router.post('/', validate(createOrganizationSchema), createOrganization);

// …and every :orgId route additionally requires membership (authority).
const orgScoped = [validate(orgIdParamSchema, 'params'), authorizeOrganization];

// ─── Organization detail & settings ──────────────────────────────────────────
router.get('/:orgId', orgScoped, getOrganization);

router.patch(
  '/:orgId',
  orgScoped,
  restrictTo(...ORG_MANAGERS),
  validate(updateOrganizationSchema),
  updateOrganization
);

router.delete('/:orgId', orgScoped, restrictTo('Owner'), deleteOrganization);

// ─── Members ─────────────────────────────────────────────────────────────────
router.post(
  '/:orgId/invite',
  orgScoped,
  restrictTo(...ORG_MANAGERS),
  validate(inviteMemberSchema),
  inviteMember
);

// ─── Nested workspace routes under an org ────────────────────────────────────
router.get('/:orgId/workspaces', orgScoped, getWorkspaces);

router.post(
  '/:orgId/workspaces',
  orgScoped,
  restrictTo(...WORKSPACE_MANAGERS),
  validate(createWorkspaceSchema),
  createWorkspace
);

export default router;
