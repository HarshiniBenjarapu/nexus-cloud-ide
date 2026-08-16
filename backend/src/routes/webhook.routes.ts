import { Router } from 'express';
import { handleGithubWebhook, handleGitlabWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/github', handleGithubWebhook);
router.post('/gitlab', handleGitlabWebhook);

export default router;
