import { useOrganizations } from './useOrganizations';

/**
 * Whether the current user may reach the admin console.
 *
 * Version 1 has no platform-administrator concept — the admin backend is a
 * later milestone (SRS Module 14). Until it exists, access is limited to users
 * who own or administer at least one organization, which is the closest
 * defensible check available today.
 *
 * Shared by the AdminRoute guard and the dashboard entry point so the two can
 * never disagree about who is allowed in.
 */
export const useCanAdminister = () => {
  const { organizations, isLoading } = useOrganizations();

  const canAdminister = organizations.some(
    (org) => org.memberRole === 'Owner' || org.memberRole === 'Admin'
  );

  return { canAdminister, isLoading };
};
