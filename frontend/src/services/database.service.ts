import { apiClient } from '../lib/apiClient';

export interface DbConnectPayload {
  dbType: string;
  connectionString: string;
}

export const databaseService = {
  connect: async (payload: DbConnectPayload) => {
    const response = await apiClient.post('/database/connect', payload);
    return response.data;
  },

  getCollections: async (dbType: string) => {
    const response = await apiClient.get('/database/collections', { params: { dbType } });
    return response.data.data;
  },

  query: async (collectionName: string, query?: string) => {
    const response = await apiClient.post('/database/query', { collectionName, query });
    return response.data.data;
  },
};
