import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { executeTerminalCommand } from '../controllers/terminal.controller';

const router = Router();

router.use(protect);
router.post('/execute', executeTerminalCommand);

export default router;
