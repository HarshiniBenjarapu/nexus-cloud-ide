import { Router } from 'express';
import {
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/:workspaceId', getWorkspace);
router.patch('/:workspaceId', updateWorkspace);
router.delete('/:workspaceId', deleteWorkspace);

export default router;
