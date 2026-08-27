import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

const getDirSize = async (dirPath: string): Promise<number> => {
  let size = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch (err) {
    // ignore missing dirs
  }
  return size;
};

export const getWorkspaceAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params.workspaceId || 'default';
    const workspacePath = path.resolve(__dirname, '..', '..', 'storage', 'projects', workspaceId);
    
    const bytesUsed = await getDirSize(workspacePath);
    const storageUsedMb = Math.round(bytesUsed / (1024 * 1024));
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsageMb = Math.round(usedMem / (1024 * 1024));
    const ramLimitMb = Math.round(totalMem / (1024 * 1024));
    
    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; // 1 minute load average
    const cpuUsagePct = Math.min(100, Math.round((loadAvg / cpus.length) * 100 * 10) / 10);

    res.json({
      status: 'success',
      data: {
        storageUsedMb,
        storageLimitMb: 5120, // 5GB limit
        cpuUsagePct,
        ramUsageMb,
        ramLimitMb,
        activeContainers: 0, // Would need docker integration
        totalDeployments: 0, // Would need DB query
        buildSuccessRate: 100,
        activityLogs: [
          { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Analytics dashboard accessed' }
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch workspace analytics' });
  }
};
