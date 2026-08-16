import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const MOCK_DOMAINS = [
  {
    id: 'dom_1',
    projectId: 'proj_default',
    domainName: 'app.nexus-dev.com',
    cnameTarget: 'cname.nexus-deploy.app',
    status: 'verified',
    sslStatus: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const addCustomDomain = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, domainName } = req.body;

    if (!domainName) {
      res.status(400).json({ status: 'error', message: 'Domain name is required' });
      return;
    }

    const newDomain = {
      id: `dom_${Date.now()}`,
      projectId,
      domainName,
      cnameTarget: `cname.${domainName.replace(/[^a-z0-9]/g, '-')}.nexus-deploy.app`,
      status: 'pending_dns',
      sslStatus: 'issuing',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({ status: 'success', data: newDomain });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to add domain' });
  }
};

export const verifyCustomDomain = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    res.json({
      status: 'success',
      data: {
        id,
        status: 'verified',
        sslStatus: 'active',
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Verification failed' });
  }
};
