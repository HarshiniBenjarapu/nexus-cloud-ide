import { apiClient } from '../lib/apiClient';

export interface AIGeneratePayload {
  prompt: string;
  fileContent?: string;
  language?: string;
}

export const aiService = {
  generate: async (payload: AIGeneratePayload) => {
    const response = await apiClient.post('/ai/generate', payload);
    return response.data.data;
  },
};
