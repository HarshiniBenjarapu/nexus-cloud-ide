import { Request, Response, NextFunction } from 'express';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

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
      .populate('organizationId')
      .lean();

    const orgs = memberships.map((m: any) => ({
      ...m.organizationId,
      memberRole: m.role,
    }));

    res.status(200).json({ success: true, message: 'Organizations retrieved.', data: { organizations: orgs } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organizations  —  Create a new organization
// ─────────────────────────────────────────────────────────────────────────────
export const createOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'Organization name and slug are required.' });
      return;
    }

    const org = await Organization.create({ name, slug, ownerId: req.user._id });

    // Add creator as Owner member
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
// GET /api/organizations/:orgId  —  Get a single org's details + member list
// ─────────────────────────────────────────────────────────────────────────────
export const getOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    const org = await Organization.findById(orgId).lean();
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    const members = await OrganizationMember.find({ organizationId: orgId })
      .populate('userId', 'fullName username email avatar')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Organization details retrieved.',
      data: { organization: org, members },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/organizations/:orgId  —  Update org name/logo
// ─────────────────────────────────────────────────────────────────────────────
export const updateOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { name, logo } = req.body;

    const org = await Organization.findByIdAndUpdate(
      orgId,
      { name, logo },
      { new: true, runValidators: true }
    );
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Organization updated.', data: { organization: org } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/organizations/:orgId  —  Delete org (Owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    if (String(org.ownerId) !== String(req.user._id)) {
      res.status(403).json({ success: false, message: 'Only the organization owner can delete it.' });
      return;
    }

    await Organization.findByIdAndDelete(orgId);
    await OrganizationMember.deleteMany({ organizationId: orgId });

    res.status(200).json({ success: true, message: 'Organization deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organizations/:orgId/invite  —  Invite member by email
// ─────────────────────────────────────────────────────────────────────────────
export const inviteMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { email, role = 'Developer' } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required to invite a member.' });
      return;
    }

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) {
      res.status(404).json({ success: false, message: `No Nexus user found with email: ${email}` });
      return;
    }

    const existing = await OrganizationMember.findOne({ organizationId: orgId, userId: invitee._id });
    if (existing) {
      res.status(409).json({ success: false, message: 'This user is already a member of the organization.' });
      return;
    }

    await OrganizationMember.create({
      organizationId: orgId,
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
