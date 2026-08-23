import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import docker from '../services/docker.service';

export const createSandboxContainer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      workspaceId,
      image = 'node:22-alpine',
      memoryLimitMb = 512,
    } = req.body;

    const container = await docker.createContainer({
      Image: image,
      Tty: false,
      Cmd: ['tail', '-f', '/dev/null'],
      HostConfig: {
        Memory: memoryLimitMb * 1024 * 1024,
        NanoCpus: 500_000_000,
      },
      Labels: {
        'nexus.workspaceId': workspaceId || '',
        'nexus.sandbox': 'true',
      },
    });

    await container.start();

    const info = await container.inspect();

    res.status(201).json({
      status: 'success',
      data: {
        containerId: info.Id,
        workspaceId,
        image,
        status: info.State.Status,
        memoryLimitMb,
        cpuLimit: '0.5 CPU',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create Docker sandbox',
    });
  }
};

export const getSandboxContainerStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const container = docker.getContainer(id);
    const info = await container.inspect();

    res.json({
      status: 'success',
      data: {
        containerId: info.Id,
        status: info.State.Status,
        running: info.State.Running,
        startedAt: info.State.StartedAt,
        finishedAt: info.State.FinishedAt,
        memoryLimitBytes: info.HostConfig.Memory,
        cpuLimitNanoCpus: info.HostConfig.NanoCpus,
      },
    });
  } catch (error: any) {
    res.status(404).json({
      status: 'error',
      message: error.message || 'Sandbox container not found',
    });
  }
};
