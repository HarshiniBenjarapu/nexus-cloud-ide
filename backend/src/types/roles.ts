/**
 * Organization-scoped roles (SRS 2.7 / 6.7).
 *
 * These roles are the single source of truth for permissions. A user has NO
 * global platform role — authority is always resolved per organization through
 * the organizationMembers collection.
 */

export type OrgRole = 'Owner' | 'Admin' | 'Maintainer' | 'Developer' | 'Viewer';

export const ORG_ROLES: OrgRole[] = ['Owner', 'Admin', 'Maintainer', 'Developer', 'Viewer'];

/**
 * Roles that may be handed out through an invitation.
 * 'Owner' is deliberately excluded: an organization has exactly one owner
 * (Organization.ownerId) and ownership transfer is not part of Version 1.
 */
export const ASSIGNABLE_ROLES: OrgRole[] = ['Admin', 'Maintainer', 'Developer', 'Viewer'];

/**
 * Which roles each inviter role is permitted to assign.
 * An Admin cannot mint other Admins — that stays an Owner-only action so that
 * organization-level authority can only ever be widened by the Owner.
 */
export const INVITABLE_ROLES_BY_INVITER: Record<string, OrgRole[]> = {
  Owner: ['Admin', 'Maintainer', 'Developer', 'Viewer'],
  Admin: ['Maintainer', 'Developer', 'Viewer'],
};

// ─── Permission groupings used by route guards ───────────────────────────────

/** Configure organization settings, invite/remove members (SRS 2.7). */
export const ORG_MANAGERS: OrgRole[] = ['Owner', 'Admin'];

/** Create, rename, archive and delete workspaces (SRS 2.7). */
export const WORKSPACE_MANAGERS: OrgRole[] = ['Owner', 'Admin'];
