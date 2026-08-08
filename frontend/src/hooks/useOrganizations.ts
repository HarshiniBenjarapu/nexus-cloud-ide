import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { queryKeys } from '../lib/queryClient';
import { fetchMyOrganizations } from '../services/organization.service';
import { Organization } from '../types';

/**
 * The authenticated user's organizations, plus the currently selected one.
 *
 * Selection lives in Redux as an id; this hook resolves it against the fetched
 * list and falls back to the first organization so the UI always has a sensible
 * active org without needing an extra effect to seed it.
 */
export const useOrganizations = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { activeOrgId } = useSelector((state: RootState) => state.workspace);

  const query = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: fetchMyOrganizations,
    enabled: isAuthenticated,
  });

  const organizations: Organization[] = query.data ?? [];
  const activeOrg =
    organizations.find((org) => org._id === activeOrgId) ?? organizations[0] ?? null;

  return { ...query, organizations, activeOrg };
};
