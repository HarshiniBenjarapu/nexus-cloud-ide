import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  addCustomDomain,
  getProjectDomains,
  verifyCustomDomain,
  deleteCustomDomain,
} from '../controllers/domain.controller';

const router = Router();

router.use(protect);
router.post('/add', addCustomDomain);
router.get('/project/:projectId', getProjectDomains);
router.post('/:id/verify', verifyCustomDomain);
router.delete('/:id', deleteCustomDomain);

export default router;
