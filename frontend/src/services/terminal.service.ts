import { apiClient } from '../lib/apiClient';

export interface ExecuteCommandPayload {
  command: string;
  projectId?: string;
}

export interface ExecuteCommandResponse {
  status: string;
  output: string;
  exitCode: number;
}

export const terminalService = {
  executeCommand: async (payload: ExecuteCommandPayload): Promise<ExecuteCommandResponse> => {
    const response = await apiClient.post<ExecuteCommandResponse>('/terminal/execute', payload);
    return response.data;
  },
};
