import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getWorkspaceAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.use(protect);
router.get('/workspace/:workspaceId', getWorkspaceAnalytics);

export default router;
