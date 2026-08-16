import { apiClient } from '../lib/apiClient';

export interface CustomDomain {
  id: string;
  projectId: string;
  domainName: string;
  cnameTarget: string;
  status: 'pending_dns' | 'verified' | 'failed';
  sslStatus: 'issuing' | 'active' | 'revoked';
  createdAt: string;
}

export const domainService = {
  addDomain: async (projectId: string, domainName: string): Promise<CustomDomain> => {
    const { data } = await apiClient.post('/domains/add', { projectId, domainName });
    return data.data;
  },

  verifyDomain: async (id: string): Promise<CustomDomain> => {
    const { data } = await apiClient.post(`/domains/${id}/verify`);
    return data.data;
  },
};
