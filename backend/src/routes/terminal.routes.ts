import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  executeTerminalCommand,
  proxyProjectPreview,
  startProjectRuntime,
} from '../controllers/terminal.controller';

const router = Router();

router.use(protect);
router.post('/execute', executeTerminalCommand);
router.post('/start-project', startProjectRuntime);
router.get('/preview/:projectId', proxyProjectPreview);
router.get('/preview/:projectId/*', proxyProjectPreview);

export default router;
