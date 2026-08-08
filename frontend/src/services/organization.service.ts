import { apiClient, ApiSuccess } from '../lib/apiClient';
import { Organization, OrganizationMember, OrgRole } from '../types';

/** Module 2 — Organization Management. */

export const fetchMyOrganizations = async (): Promise<Organization[]> => {
  const { data } =
    await apiClient.get<ApiSuccess<{ organizations: Organization[] }>>('/organizations');
  return data.data.organizations;
};

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
}

export const createOrganization = async (
  payload: CreateOrganizationPayload
): Promise<Organization> => {
  const { data } = await apiClient.post<ApiSuccess<{ organization: Organization }>>(
    '/organizations',
    payload
  );
  return data.data.organization;
};

export interface OrganizationDetail {
  organization: Organization;
  members: OrganizationMember[];
  memberRole: OrgRole;
}

export const fetchOrganization = async (orgId: string): Promise<OrganizationDetail> => {
  const { data } = await apiClient.get<ApiSuccess<OrganizationDetail>>(
    `/organizations/${orgId}`
  );
  return data.data;
};
