import { OrgRole } from '../types';

/**
 * UI permission gates for Modules 4 & 6.
 *
 * These mirror the backend guards in routes/project.routes.ts. They exist to
 * hide controls the user cannot use — the server remains the only thing that
 * actually enforces authority, so a stale role here can never grant access.
 */

/** Create, rename, duplicate, archive and edit files (SRS 2.7). */
const CONTRIBUTOR_ROLES: OrgRole[] = ['Owner', 'Admin', 'Maintainer', 'Developer'];

/** Project deletion is maintenance, so it stops at Maintainer. */
const MAINTAINER_ROLES: OrgRole[] = ['Owner', 'Admin', 'Maintainer'];

export const useProjectPermissions = (memberRole: OrgRole | null | undefined) => {
  const canContribute = memberRole ? CONTRIBUTOR_ROLES.includes(memberRole) : false;

  return {
    /** Create projects, rename, duplicate, archive/restore, favorite. */
    canContribute,
    /** Create, rename, duplicate and delete files and folders. */
    canEditFiles: canContribute,
    /** Delete a project. */
    canDeleteProject: memberRole ? MAINTAINER_ROLES.includes(memberRole) : false,
    /** True for Viewer — used to explain why controls are missing. */
    isReadOnly: memberRole === 'Viewer',
  };
};
