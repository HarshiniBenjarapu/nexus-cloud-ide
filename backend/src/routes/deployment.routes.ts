import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createDeployment, getProjectDeployments } from '../controllers/deployment.controller';

const router = Router();

router.use(protect);
router.post('/', createDeployment);
router.get('/project/:projectId', getProjectDeployments);

export default router;
