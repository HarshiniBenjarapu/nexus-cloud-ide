import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { generateAIResponse } from '../controllers/ai.controller';

const router = Router();

router.use(protect);
router.post('/generate', generateAIResponse);

export default router;
