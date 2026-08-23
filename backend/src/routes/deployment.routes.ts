import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createDeployment,
  getProjectDeployments,
  getDeploymentById,
  syncDeploymentStatus,
  redeployProject,
  deleteDeployment,
} from '../controllers/deployment.controller';

const router = Router();

router.use(protect);
router.post('/', createDeployment);
router.get('/project/:projectId', getProjectDeployments);
router.get('/:id', getDeploymentById);
router.get('/:id/sync', syncDeploymentStatus);
router.post('/:id/redeploy', redeployProject);
router.delete('/:id', deleteDeployment);

export default router;
