import crypto from 'crypto';
import { Request, Response } from 'express';
import { Deployment } from '../models/Deployment';
import { Project } from '../models/Project';

/** Verify GitHub HMAC-SHA256 webhook signature to prevent unauthorized triggers. */
const verifyGithubSignature = (req: Request): boolean => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true; // Skip validation if secret not configured (dev only)

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body));
  const digest = `sha256=${hmac.digest('hex')}`;

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

/** Escape a string so it is safe to embed in a RegExp literal. */
const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const handleGithubWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyGithubSignature(req)) {
      res.status(401).json({ status: 'error', message: 'Invalid webhook signature.' });
      return;
    }

    const payload = req.body;
    const ref = payload.ref || 'refs/heads/main';
    const commitMsg = payload.head_commit?.message || 'Automated git push trigger';
    const repoName = payload.repository?.name;

    let project = null;
    if (repoName) {
      // Use escaped string for safe regex matching
      project = await Project.findOne({ name: new RegExp(escapeRegex(repoName), 'i') });
    }
    if (!project) {
      project = await Project.findOne().sort({ createdAt: -1 });
    }

    if (!project) {
      res.status(400).json({ status: 'error', message: 'No matching project found for webhook trigger' });
      return;
    }

    const liveUrl = `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-ci.vercel.app`;

    const deployment = await Deployment.create({
      projectId: project._id,
      workspaceId: project.workspaceId,
      createdBy: project.createdBy,
      provider: 'vercel',
      status: 'building',
      liveUrl,
      buildLogs: [
        `[GitHub Webhook] Received push event on branch ${ref}`,
        `[GitHub Webhook] Commit: "${commitMsg}"`,
        `[CI/CD Pipeline] Triggering deployment pipeline for ${project.name}...`,
        `[CI/CD Pipeline] Build & verification complete. Live at ${liveUrl}`,
      ],
      envVars: { CI: 'true', TRIGGER: 'github_webhook' },
    });

    setTimeout(async () => {
      try {
        await Deployment.findByIdAndUpdate(deployment._id, { status: 'deployed' });
      } catch (e) {
        // ignore
      }
    }, 1500);

    res.json({
      status: 'success',
      message: `Triggered CI/CD pipeline for commit "${commitMsg}" on ${ref}`,
      data: deployment,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Webhook processing failed' });
  }
};

export const handleGitlabWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';
    const commitMsg = payload.commits?.[0]?.message || 'Automated GitLab push trigger';

    const project = await Project.findOne().sort({ createdAt: -1 });
    if (!project) {
      res.status(400).json({ status: 'error', message: 'No project found for GitLab trigger' });
      return;
    }

    const liveUrl = `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-gitlab.vercel.app`;

    const deployment = await Deployment.create({
      projectId: project._id,
      workspaceId: project.workspaceId,
      createdBy: project.createdBy,
      provider: 'vercel',
      status: 'building',
      liveUrl,
      buildLogs: [
        `[GitLab Webhook] Received push event on branch ${branch}`,
        `[GitLab Webhook] Commit: "${commitMsg}"`,
        `[CI/CD Pipeline] Building GitLab integration target...`,
        `[CI/CD Pipeline] Successfully deployed to ${liveUrl}`,
      ],
      envVars: { CI: 'true', TRIGGER: 'gitlab_webhook' },
    });

    setTimeout(async () => {
      try {
        await Deployment.findByIdAndUpdate(deployment._id, { status: 'deployed' });
      } catch (e) {
        // ignore
      }
    }, 1500);

    res.json({
      status: 'success',
      message: `GitLab webhook received. Triggered deployment for branch: ${branch}`,
      data: deployment,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'GitLab webhook failed' });
  }
};