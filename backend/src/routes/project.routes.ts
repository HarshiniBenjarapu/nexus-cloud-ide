import { Router } from 'express';
import {
  getProject,
  updateProject,
  duplicateProject,
  archiveProject,
  restoreProject,
  deleteProject,
} from '../controllers/project.controller';
import {
  getFileTree,
  getFileContent,
  writeFile,
  createEntry,
  renameEntry,
  duplicateEntry,
  deleteEntry,
} from '../controllers/file.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeProject, restrictTo } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateProjectSchema,
  duplicateProjectSchema,
  projectIdParamSchema,
} from '../validators/project.validator';
import {
  readFileQuerySchema,
  writeFileSchema,
  createEntrySchema,
  renameEntrySchema,
  duplicateEntrySchema,
  deleteEntrySchema,
} from '../validators/file.validator';
import { PROJECT_CONTRIBUTORS, FILE_EDITORS } from '../types/templates';

const router = Router();

// Identity…
router.use(protect);

// …then authority: authorizeProject walks project → workspace → organization
// and verifies the caller is a member of it.
const projectScoped = [validate(projectIdParamSchema, 'params'), authorizeProject];

// ─── Project detail & settings (Module 4) ────────────────────────────────────
router.get('/:projectId', projectScoped, getProject);

router.patch(
  '/:projectId',
  projectScoped,
  restrictTo(...PROJECT_CONTRIBUTORS),
  validate(updateProjectSchema),
  updateProject
);

router.post(
  '/:projectId/duplicate',
  projectScoped,
  restrictTo(...PROJECT_CONTRIBUTORS),
  validate(duplicateProjectSchema),
  duplicateProject
);

router.patch(
  '/:projectId/archive',
  projectScoped,
  restrictTo(...PROJECT_CONTRIBUTORS),
  archiveProject
);

router.patch(
  '/:projectId/restore',
  projectScoped,
  restrictTo(...PROJECT_CONTRIBUTORS),
  restoreProject
);

// Deleting a project is maintenance, so it stops at Maintainer (SRS 2.7).
router.delete(
  '/:projectId',
  projectScoped,
  restrictTo('Owner', 'Admin', 'Maintainer'),
  deleteProject
);

// ─── File explorer (Module 6) ────────────────────────────────────────────────
// Reads are open to any member, including Viewer (SRS 2.7 — read-only access).
router.get('/:projectId/files', projectScoped, getFileTree);

router.get(
  '/:projectId/files/content',
  projectScoped,
  validate(readFileQuerySchema, 'query'),
  getFileContent
);

// Writes require Developer or above.
const fileEditor = [...projectScoped, restrictTo(...FILE_EDITORS)];

router.put(
  '/:projectId/files/content',
  fileEditor,
  validate(writeFileSchema),
  writeFile
);

router.post('/:projectId/files', fileEditor, validate(createEntrySchema), createEntry);

router.patch(
  '/:projectId/files/rename',
  fileEditor,
  validate(renameEntrySchema),
  renameEntry
);

router.post(
  '/:projectId/files/duplicate',
  fileEditor,
  validate(duplicateEntrySchema),
  duplicateEntry
);

router.delete(
  '/:projectId/files',
  fileEditor,
  validate(deleteEntrySchema),
  deleteEntry
);

export default router;
