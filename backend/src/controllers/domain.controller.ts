import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Domain } from '../models/Domain';

// ─── POST /api/domains/add ──────────────────────────────────────────────────
export const addCustomDomain = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, domainName } = req.body;

    if (!projectId || !domainName) {
      res.status(400).json({ status: 'error', message: 'Project ID and domain name are required' });
      return;
    }

    const cleanDomain = domainName.trim().toLowerCase();
    const cnameTarget = `cname.${cleanDomain.replace(/[^a-z0-9]/g, '-')}.nexus-deploy.app`;

    const domain = await Domain.create({
      projectId,
      domainName: cleanDomain,
      cnameTarget,
      status: 'pending_dns',
      sslStatus: 'issuing',
    });

    res.status(201).json({ status: 'success', data: domain });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to add custom domain' });
  }
};

// ─── GET /api/domains/project/:projectId ───────────────────────────────────
export const getProjectDomains = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const domains = await Domain.find({ projectId }).sort({ createdAt: -1 });

    res.json({ status: 'success', data: domains });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch project domains' });
  }
};

// ─── POST /api/domains/:id/verify ───────────────────────────────────────────
export const verifyCustomDomain = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const domain = await Domain.findById(id);

    if (!domain) {
      res.status(404).json({ status: 'error', message: 'Domain not found' });
      return;
    }

    domain.status = 'verified';
    domain.sslStatus = 'active';
    await domain.save();

    res.json({ status: 'success', data: domain });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Domain verification failed' });
  }
};

// ─── DELETE /api/domains/:id ────────────────────────────────────────────────
export const deleteCustomDomain = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const domain = await Domain.findByIdAndDelete(id);

    if (!domain) {
      res.status(404).json({ status: 'error', message: 'Domain record not found' });
      return;
    }

    res.json({ status: 'success', message: 'Custom domain removed successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete domain' });
  }
};
