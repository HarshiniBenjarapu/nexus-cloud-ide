import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

// ─── Helper: Resolve first frontend URL from a potentially comma-separated list ─
const getFrontendUrl = (): string => {
  const origin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  return origin.split(',')[0].trim();
};

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

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      fullName,
      username,
      email,
      passwordHash: password,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    const verificationUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(
      user.email,
      user.fullName,
      verificationUrl
    );
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
export const githubCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, message: 'GitHub authorization code is required.' });
      return;
    }

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      res.status(401).json({ success: false, message: 'GitHub token exchange failed.' });
      return;
    }

    const githubResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const githubUser = githubResponse.data;
    let userEmail = githubUser.email;

    if (!userEmail) {
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        });
        if (Array.isArray(emailsResponse.data)) {
          const primary =
            emailsResponse.data.find((e: any) => e.primary && e.verified) ||
            emailsResponse.data.find((e: any) => e.verified) ||
            emailsResponse.data[0];
          if (primary?.email) {
            userEmail = primary.email;
          }
        }
      } catch (e) {
        console.error('Failed to fetch GitHub email list:', e);
      }
    }

    if (!userEmail) {
      userEmail = `${githubUser.login}@users.noreply.github.com`;
    }

    let user = await User.findOne({ githubId: String(githubUser.id) });

    // Only attempt email matching if githubId is not linked AND userEmail is a real email address (not a noreply fallback)
    if (!user && userEmail && !userEmail.includes('noreply.github.com')) {
      user = await User.findOne({ email: userEmail });
    }

    if (!user) {
      const sanitizedLogin = (githubUser.login || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
      const username = `${sanitizedLogin.substring(0, 20)}_${Math.random().toString(36).substring(2, 6)}`;

      user = await User.create({
        fullName: githubUser.name || githubUser.login,
        username,
        email: userEmail,
        avatar: githubUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${sanitizedLogin}`,
        authProvider: 'github',
        githubId: String(githubUser.id),
        emailVerified: true,
        passwordHash: `github_oauth_${String(githubUser.id)}_${Date.now()}`,
      });

      // Auto-create personal organization
      const orgSlug = `${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-personal`;
      const org = await Organization.create({
        name: `${user.fullName}'s Organization`,
        slug: orgSlug,
        ownerId: user._id,
      });

      await OrganizationMember.create({
        organizationId: org._id,
        userId: user._id,
        role: 'Owner',
        invitedBy: user._id,
      });
    } else {
      if (!user.githubId) {
        user.githubId = String(githubUser.id);
        user.authProvider = 'github';
        user.emailVerified = true;
        await user.save();
      }

      // Ensure user has at least one organization
      const existingOrgMember = await OrganizationMember.findOne({ userId: user._id });
      if (!existingOrgMember) {
        const orgSlug = `${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-personal`;
        const org = await Organization.create({
          name: `${user.fullName}'s Organization`,
          slug: orgSlug,
          ownerId: user._id,
        });

        await OrganizationMember.create({
          organizationId: org._id,
          userId: user._id,
          role: 'Owner',
          invitedBy: user._id,
        });
      }
    }

    const token = signToken(String(user._id));

    res.redirect(`${getFrontendUrl()}/oauth/callback?token=${encodeURIComponent(token)}`);
  } catch (error: any) {
    console.error('[GitHub Callback Error]:', error.response?.data || error.message || error);
    const errorMsg = error.response?.data?.error_description || error.message || 'GitHub authentication failed. Please try again.';
    res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent(errorMsg)}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/social  (GitHub / Google OAuth2 callback or SSO token exchange)
// ─────────────────────────────────────────────────────────────────────────────
export const socialAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { provider, email, fullName, avatar } = req.body;

    if (!email || !provider) {
      res.status(400).json({ success: false, message: 'Provider and email are required.' });
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      const emailPrefix = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
      const username = `${emailPrefix.substring(0, 20)}_${Math.random().toString(36).substring(2, 6)}`;
      const randomPassword = `social_sso_${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      user = await User.create({
        fullName: fullName || email.split('@')[0],
        username,
        email,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        emailVerified: true,
        authProvider: provider.toLowerCase() === 'github' ? 'github' : 'google',
        passwordHash: randomPassword,
      });

      // Auto-create personal organization
      const orgSlug = `${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-personal`;
      const org = await Organization.create({
        name: `${user.fullName}'s Organization`,
        slug: orgSlug,
        ownerId: user._id,
      });

      await OrganizationMember.create({
        organizationId: org._id,
        userId: user._id,
        role: 'Owner',
        invitedBy: user._id,
      });
    } else {
      // Ensure existing user has an organization
      const existingOrgMember = await OrganizationMember.findOne({ userId: user._id });
      if (!existingOrgMember) {
        const orgSlug = `${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-personal`;
        const org = await Organization.create({
          name: `${user.fullName}'s Organization`,
          slug: orgSlug,
          ownerId: user._id,
        });

        await OrganizationMember.create({
          organizationId: org._id,
          userId: user._id,
          role: 'Owner',
          invitedBy: user._id,
        });
      }
    }

    const token = signToken(String(user._id));

    res.status(200).json({
      success: true,
      message: `Successfully authenticated with ${provider.toUpperCase()}!`,
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your client-side JWT token.',
  });
};
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select(
      '+passwordResetToken +passwordResetExpires'
    );

    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(user.email, user.fullName, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully.',
    });
  } catch (error) {
    next(error);
  }
};
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordHash +passwordResetToken +passwordResetExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
      return;
    }

    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    next(error);
  }
};
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
      return;
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link.',
      });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};