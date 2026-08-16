import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export const createSandboxContainer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, image = 'node:20-alpine', memoryLimitMb = 512 } = req.body;

    const containerId = `cnt_${Math.random().toString(36).substring(2, 9)}`;

    res.status(201).json({
      status: 'success',
      data: {
        containerId,
        workspaceId,
        image,
        status: 'running',
        memoryLimitMb,
        cpuQuotaShares: 1024,
        allocatedIp: '172.18.0.14',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to initialize container sandbox' });
  }
};

export const getSandboxContainerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    res.json({
      status: 'success',
      data: {
        containerId: id,
        status: 'running',
        uptimeSeconds: 1420,
        cpuUsagePct: 8.4,
        memoryUsageMb: 128,
        networkRxKb: 450,
        networkTxKb: 120,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch sandbox status' });
  }
};
