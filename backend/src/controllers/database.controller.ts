import { Request, Response } from 'express';

export const connectDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dbType, connectionString } = req.body;

    if (!dbType || !connectionString) {
      res.status(400).json({ status: 'error', message: 'Database type and connection URI are required' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        connected: true,
        dbType,
        databaseName: dbType === 'mongodb' ? 'nexus_dev_db' : 'nexus_postgres_db',
        latencyMs: 14,
        collectionsCount: dbType === 'mongodb' ? 4 : 6,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Database connection failed' });
  }
};

export const getDatabaseCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dbType } = req.query;

    const collections = dbType === 'mongodb'
      ? [
          { name: 'users', count: 128, size: '24 KB' },
          { name: 'workspaces', count: 14, size: '8 KB' },
          { name: 'projects', count: 32, size: '16 KB' },
          { name: 'files', count: 340, size: '120 KB' },
        ]
      : [
          { name: 'users_table', count: 128, size: '32 KB' },
          { name: 'projects_table', count: 32, size: '16 KB' },
          { name: 'audit_logs', count: 1042, size: '256 KB' },
        ];

    res.json({ status: 'success', data: { collections } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to list collections' });
  }
};

export const runDatabaseQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collectionName, query } = req.body;

    res.json({
      status: 'success',
      data: {
        collection: collectionName || 'users',
        executionTimeMs: 4,
        count: 2,
        documents: [
          { _id: '65c192a01', name: 'Harshini Benjarapu', role: 'System Admin', email: 'harshini@nexus.dev' },
          { _id: '65c192a02', name: 'Demo Workspace Member', role: 'Developer', email: 'dev@nexus.dev' },
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Database query execution failed' });
  }
};
