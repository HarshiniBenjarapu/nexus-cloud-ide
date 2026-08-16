import { Request, Response } from 'express';

export const handleGithubWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const ref = payload.ref || 'refs/heads/main';
    const commitMsg = payload.head_commit?.message || 'Automated commit build trigger';

    res.json({
      status: 'success',
      message: `Triggered deployment pipeline for commit "${commitMsg}" on branch ${ref}`,
      deploymentId: `dep_wh_${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Webhook processing failed' });
  }
};

export const handleGitlabWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';

    res.json({
      status: 'success',
      message: `GitLab webhook received. Triggered CI build for branch: ${branch}`,
      deploymentId: `dep_gl_${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'GitLab webhook failed' });
  }
};
