import { apiClient, ApiSuccess } from '../lib/apiClient';

export interface ExtensionItem {
  id: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  downloads: string;
  rating: number;
  category: string;
  installed: boolean;
}

export const extensionService = {
  getExtensions: async (): Promise<ExtensionItem[]> => {
    const { data } = await apiClient.get<ApiSuccess<ExtensionItem[]>>('/extensions');
    return data.data;
  },

  toggleInstall: async (id: string): Promise<ExtensionItem> => {
    const { data } = await apiClient.post<ApiSuccess<ExtensionItem>>(`/extensions/${id}/install`);
    return data.data;
  },
};
