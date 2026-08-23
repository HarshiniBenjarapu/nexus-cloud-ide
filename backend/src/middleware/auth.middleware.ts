import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: any;
}

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
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

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

// ──────────────────────────────────────────────────
// Role-based access control lives in authorize.middleware.ts.
//
// The previous `restrictTo` here read the global User.role field, which has
// been removed: permissions are organization-scoped (SRS 2.7 / 6.7) and are
// resolved from the organizationMembers collection.
// ──────────────────────────────────────────────────
