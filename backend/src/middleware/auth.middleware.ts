import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { IOrganization } from '../models/Organization';
import { IOrganizationMember } from '../models/OrganizationMember';
import { IWorkspace } from '../models/Workspace';
import { IProject } from '../models/Project';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      organization?: IOrganization;
      membership?: IOrganizationMember;
      workspace?: IWorkspace;
      project?: IProject;
    }
  }
}

export type AuthRequest = Request;

// ──────────────────────────────────────────────────
// Protect: Verify JWT and attach user to request
// ──────────────────────────────────────────────────
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'nexus_cloud_ide_super_secret_jwt_key_2026';
    const decoded: any = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.',
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};
