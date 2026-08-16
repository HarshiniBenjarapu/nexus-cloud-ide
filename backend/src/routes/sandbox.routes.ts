import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createSandboxContainer, getSandboxContainerStatus } from '../controllers/sandbox.controller';

const router = Router();

router.use(protect);
router.post('/create', createSandboxContainer);
router.get('/:id', getSandboxContainerStatus);

export default router;
