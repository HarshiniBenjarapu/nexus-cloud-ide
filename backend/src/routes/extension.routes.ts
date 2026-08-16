import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getExtensions, toggleExtensionInstall } from '../controllers/extension.controller';

const router = Router();

router.use(protect);
router.get('/', getExtensions);
router.post('/:id/install', toggleExtensionInstall);

export default router;
