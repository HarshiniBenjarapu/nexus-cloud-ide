import { Request, Response } from 'express';
import { ProjectFile } from '../models/ProjectFile';

export const getGitStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const files = await ProjectFile.find({ projectId });
    const modifiedFiles = files
      .slice(0, 5)
      .map((f, i) => ({
        path: f.path,
        status: i % 2 === 0 ? 'modified' : 'untracked',
        staged: false,
      }));

    res.json({
      status: 'success',
      data: {
        currentBranch: 'main',
        ahead: 1,
        behind: 0,
        files: modifiedFiles.length > 0 ? modifiedFiles : [
          { path: 'src/App.tsx', status: 'modified', staged: false },
          { path: 'src/index.css', status: 'modified', staged: false },
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch git status' });
  }
};

export const createGitCommit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ status: 'error', message: 'Commit message is required' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        commitId: `c_${Math.random().toString(36).substring(2, 9)}`,
        message,
        timestamp: new Date().toISOString(),
        branch: 'main',
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create commit' });
  }
};

export const getGitBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      status: 'success',
      data: {
        currentBranch: 'main',
        branches: ['main', 'feature/auth-v2', 'fix/editor-sync'],
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch branches' });
  }
};
