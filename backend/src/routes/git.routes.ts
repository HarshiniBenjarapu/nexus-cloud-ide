import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getGitStatus, createGitCommit, getGitBranches } from '../controllers/git.controller';

const router = Router();

router.use(protect);
router.get('/:projectId/status', getGitStatus);
router.post('/:projectId/commit', createGitCommit);
router.get('/:projectId/branches', getGitBranches);

export default router;
