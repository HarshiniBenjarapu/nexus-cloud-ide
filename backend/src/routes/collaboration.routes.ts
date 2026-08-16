import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getWorkspacePresence, inviteMember } from '../controllers/collaboration.controller';

const router = Router();

router.use(protect);
router.get('/presence/:workspaceId', getWorkspacePresence);
router.post('/invite', inviteMember);

export default router;
