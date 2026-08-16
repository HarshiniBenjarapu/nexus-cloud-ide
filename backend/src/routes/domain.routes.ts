import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { addCustomDomain, verifyCustomDomain } from '../controllers/domain.controller';

const router = Router();

router.use(protect);
router.post('/add', addCustomDomain);
router.post('/:id/verify', verifyCustomDomain);

export default router;
