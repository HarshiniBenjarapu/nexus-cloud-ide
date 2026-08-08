import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Organization, Workspace } from '../types';
import { mockOrganizations, mockWorkspaces } from '../services/mockData';

interface WorkspaceState {
  organizations: Organization[];
  activeOrg: Organization | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
}

const initialState: WorkspaceState = {
  organizations: mockOrganizations,
  activeOrg: mockOrganizations[0],
  workspaces: mockWorkspaces,
  activeWorkspace: mockWorkspaces[0],
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveOrg: (state, action: PayloadAction<Organization>) => {
      state.activeOrg = action.payload;
    },
    setActiveWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.activeWorkspace = action.payload;
    },
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspaces.push(action.payload);
      state.activeWorkspace = action.payload;
    },
  },
});

export const { setActiveOrg, setActiveWorkspace, addWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
