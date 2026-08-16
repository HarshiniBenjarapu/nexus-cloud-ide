import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export const getWorkspacePresence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      status: 'success',
      data: [
        { id: req.user._id, name: req.user.name || 'You', email: req.user.email, role: 'Owner', status: 'online', activeFile: 'src/App.tsx' },
        { id: 'usr_collab_2', name: 'Alex Rivera', email: 'alex@nexus.dev', role: 'Admin', status: 'online', activeFile: 'src/index.css' },
        { id: 'usr_collab_3', name: 'Priya Sharma', email: 'priya@nexus.dev', role: 'Member', status: 'idle', activeFile: 'server.ts' },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch collaboration presence' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, role = 'Member', workspaceId } = req.body;

    if (!email) {
      res.status(400).json({ status: 'error', message: 'Email address is required' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        inviteId: `inv_${Date.now()}`,
        email,
        role,
        workspaceId,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to invite member' });
  }
};
