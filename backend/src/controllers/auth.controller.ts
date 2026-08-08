import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';

// ─── Helper: Sign a JWT ───────────────────────────────────────────────────────
const signToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// ─── Helper: Build safe user response object ─────────────────────────────────
// Note: no `role` here. A user has no global role — authority is per
// organization and is returned as `memberRole` on each organization.
const buildUserResponse = (user: IUser) => ({
  id: user._id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Shape, length and format are already guaranteed by registerSchema
    const { fullName, username, email, password } = req.body;

    // Check for existing email or username
    const existing = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
      return;
    }

    // Create User
    const user = await User.create({
      fullName,
      username,
      email,
      passwordHash: password,
    });

    // Auto-create a personal organization for this user
    const orgSlug = `${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-personal`;
    const org = await Organization.create({
      name: `${fullName}'s Organization`,
      slug: orgSlug,
      ownerId: user._id,
    });

    // Add owner as member of the org
    await OrganizationMember.create({
      organizationId: org._id,
      userId: user._id,
      role: 'Owner',
      invitedBy: user._id,
    });

    const token = signToken(String(user._id));

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Nexus Cloud IDE.',
      data: {
        token,
        user: buildUserResponse(user),
        defaultOrganization: { id: org._id, name: org.name, slug: org.slug },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Shape and format are already guaranteed by loginSchema
    const { email, password } = req.body;

    // Explicitly select passwordHash since it's excluded by default
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support at support@nexuside.com.',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = signToken(String(user._id));

    res.status(200).json({
      success: true,
      message: 'Login successful. Welcome back!',
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (Protected)
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: { user: buildUserResponse(user) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (Stateless — client should discard the JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your client-side JWT token.',
  });
};
