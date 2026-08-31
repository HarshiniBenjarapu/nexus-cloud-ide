import { apiClient } from '../lib/apiClient';

export interface ExecuteCommandPayload {
  command: string;
  projectId?: string;
  workspaceId?: string;
}

export interface ExecuteCommandResponse {
  status: string;
  output: string;
  exitCode: number;
}

export interface StartProjectRuntimePayload {
  workspaceId: string;
  projectId: string;
}

export interface StartProjectRuntimeResponse {
  status: string;
  launched: boolean;
  alreadyRunning: boolean;
  url: string;
  port: number;
}

export const terminalService = {
  executeCommand: async (payload: ExecuteCommandPayload): Promise<ExecuteCommandResponse> => {
    const response = await apiClient.post<ExecuteCommandResponse>('/terminal/execute', payload);
    return response.data;
  },
  startProjectRuntime: async (payload: StartProjectRuntimePayload): Promise<StartProjectRuntimeResponse> => {
    const response = await apiClient.post<StartProjectRuntimeResponse>('/terminal/start-project', payload);
    return response.data;
  },
};
