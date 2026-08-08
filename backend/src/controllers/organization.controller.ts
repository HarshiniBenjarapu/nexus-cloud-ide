import { Response, NextFunction } from 'express';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { Workspace } from '../models/Workspace';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuthorizedRequest } from '../middleware/authorize.middleware';
import { INVITABLE_ROLES_BY_INVITER, OrgRole } from '../types/roles';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organizations  —  List all orgs the current user belongs to
// ─────────────────────────────────────────────────────────────────────────────
export const getMyOrganizations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberships = await OrganizationMember.find({ userId: req.user._id })
      // `match` drops soft-deleted organizations, leaving organizationId null
      .populate({ path: 'organizationId', match: { deletedAt: null } })
      .lean();

    const liveMemberships = memberships.filter((m: any) => m.organizationId);

    // Member counts for all of the user's orgs in one round trip (avoids N+1)
    const counts = await OrganizationMember.aggregate<{ _id: any; count: number }>([
      { $match: { organizationId: { $in: liveMemberships.map((m: any) => m.organizationId._id) } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]);
    const countByOrgId = new Map(counts.map((c) => [String(c._id), c.count]));

    const organizations = liveMemberships.map((m: any) => ({
      ...m.organizationId,
      memberRole: m.role,
      memberCount: countByOrgId.get(String(m.organizationId._id)) ?? 0,
    }));

    res.status(200).json({
      success: true,
      message: 'Organizations retrieved.',
      data: { organizations },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organizations  —  Create a new organization
// The creator always becomes its Owner.
// ─────────────────────────────────────────────────────────────────────────────
export const createOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug } = req.body;

    const org = await Organization.create({ name, slug, ownerId: req.user._id });

    await OrganizationMember.create({
      organizationId: org._id,
      userId: req.user._id,
      role: 'Owner',
      invitedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Organization "${org.name}" created successfully.`,
      data: { organization: org },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organizations/:orgId  —  Org details + member list
// Requires: organization membership (any role).
// ─────────────────────────────────────────────────────────────────────────────
export const getOrganization = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Resolved and access-checked by authorizeOrganization
    const org = req.organization!;

    const members = await OrganizationMember.find({ organizationId: org._id })
      .populate('userId', 'fullName username email avatar')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Organization details retrieved.',
      data: {
        organization: org.toObject(),
        members,
        memberRole: req.membership!.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/organizations/:orgId  —  Update org name/logo
// Requires: Owner or Admin ("configure organization settings", SRS 2.7).
// ─────────────────────────────────────────────────────────────────────────────
export const updateOrganization = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, logo } = req.body;

    // Only apply fields the client actually sent
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (logo !== undefined) updates.logo = logo;

    const org = await Organization.findOneAndUpdate(
      { _id: req.organization!._id, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Organization updated.',
      data: { organization: org },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/organizations/:orgId  —  Soft-delete org (Owner only, SRS 2.7)
//
// Cascades the soft delete to the organization's workspaces so none are left
// orphaned (SRS 6.21). Memberships are intentionally preserved so the
// organization stays recoverable.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteOrganization = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const org = req.organization!;

    // The role gate already restricted this to Owner. This second check keeps
    // Organization.ownerId authoritative even if membership roles drift.
    if (String(org.ownerId) !== String(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Only the organization owner can delete it.',
      });
      return;
    }

    const deletedAt = new Date();

    const { modifiedCount } = await Workspace.updateMany(
      { organizationId: org._id, deletedAt: null },
      { deletedAt }
    );

    org.deletedAt = deletedAt;
    await org.save();

    res.status(200).json({
      success: true,
      message: `Organization deleted successfully. ${modifiedCount} workspace(s) archived with it.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organizations/:orgId/invite  —  Invite member by email
// Requires: Owner or Admin ("invite members", SRS 2.7).
// ─────────────────────────────────────────────────────────────────────────────
export const inviteMember = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, role = 'Developer' } = req.body as { email: string; role?: OrgRole };
    const org = req.organization!;
    const inviterRole = req.membership!.role;

    // Privilege-escalation guard: an inviter may only assign roles below their
    // own authority, and 'Owner' can never be assigned through an invite.
    const allowedRoles = INVITABLE_ROLES_BY_INVITER[inviterRole] ?? [];
    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        message: `As ${inviterRole} you may only assign these roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) {
      res.status(404).json({
        success: false,
        message: `No Nexus user found with email: ${email}`,
      });
      return;
    }

    const existing = await OrganizationMember.findOne({
      organizationId: org._id,
      userId: invitee._id,
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'This user is already a member of the organization.',
      });
      return;
    }

    await OrganizationMember.create({
      organizationId: org._id,
      userId: invitee._id,
      role,
      invitedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `${invitee.fullName} has been added as ${role} to the organization.`,
    });
  } catch (error) {
    next(error);
  }
};
