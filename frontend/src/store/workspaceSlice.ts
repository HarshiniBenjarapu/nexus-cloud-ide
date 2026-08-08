import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Workspace *selection* state.
 *
 * Per SRS 5.13 the organization and workspace collections themselves are server
 * state and live in TanStack Query (see hooks/useOrganizations, hooks/useWorkspaces).
 * Redux keeps only which of them the user currently has selected, so there is
 * exactly one source of truth for each.
 */
interface WorkspaceState {
  activeOrgId: string | null;
  activeWorkspaceId: string | null;
}

const initialState: WorkspaceState = {
  activeOrgId: null,
  activeWorkspaceId: null,
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveOrgId: (state, action: PayloadAction<string | null>) => {
      if (state.activeOrgId !== action.payload) {
        // Switching organization invalidates the current workspace choice
        state.activeWorkspaceId = null;
      }
      state.activeOrgId = action.payload;
    },
    setActiveWorkspaceId: (state, action: PayloadAction<string | null>) => {
      state.activeWorkspaceId = action.payload;
    },
    clearWorkspaceSelection: (state) => {
      state.activeOrgId = null;
      state.activeWorkspaceId = null;
    },
  },
});

export const { setActiveOrgId, setActiveWorkspaceId, clearWorkspaceSelection } =
  workspaceSlice.actions;
export default workspaceSlice.reducer;
