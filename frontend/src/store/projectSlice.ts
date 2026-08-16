import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EditorTab } from '../types';

/**
 * Project *selection* and editor buffer state.
 *
 * Per SRS 5.13 the project and file collections are server state and live in
 * TanStack Query (hooks/useProjects, hooks/useFiles). Redux keeps only which
 * project is selected and which files are open, so there is exactly one source
 * of truth for each.
 *
 * A tab is identified by `projectId + filePath` — the same identity the API
 * uses — so renames and project switches stay consistent without client ids.
 */
interface ProjectState {
  activeProjectId: string | null;
  openTabs: EditorTab[];
  activeTabId: string | null;
  isSplitView: boolean;
  splitTabId: string | null;
}

const initialState: ProjectState = {
  activeProjectId: null,
  openTabs: [],
  activeTabId: null,
  isSplitView: false,
  splitTabId: null,
};

/** Stable tab id derived from the file's identity, not a timestamp. */
export const tabIdFor = (projectId: string, filePath: string): string =>
  `${projectId}:${filePath}`;

const fileNameOf = (filePath: string): string =>
  filePath.split('/').pop() || filePath;

/** Keep activeTabId and splitTabId pointing at tabs that still exist. */
const reconcileSelection = (state: ProjectState, closedId?: string): void => {
  if (closedId && state.activeTabId === closedId) {
    state.activeTabId = state.openTabs.length
      ? state.openTabs[state.openTabs.length - 1].id
      : null;
  }
  if (state.splitTabId && !state.openTabs.some((t) => t.id === state.splitTabId)) {
    state.splitTabId = null;
    state.isSplitView = false;
  }
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    /** Switching projects closes the previous project's tabs. */
    setActiveProjectId: (state, action: PayloadAction<string | null>) => {
      if (state.activeProjectId !== action.payload) {
        state.openTabs = [];
        state.activeTabId = null;
        state.isSplitView = false;
        state.splitTabId = null;
      }
      state.activeProjectId = action.payload;
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },

    openFileTab: (
      state,
      action: PayloadAction<{
        projectId: string;
        filePath: string;
        content: string;
        language: string;
      }>
    ) => {
      const { projectId, filePath, content, language } = action.payload;
      const id = tabIdFor(projectId, filePath);
      const existing = state.openTabs.find((t) => t.id === id);

      if (existing) {
        // Never clobber a buffer the user has unsaved edits in
        if (!existing.isUnsaved) {
          existing.content = content;
        }
        state.activeTabId = existing.id;
        return;
      }

      state.openTabs.push({
        id,
        projectId,
        filePath,
        fileName: fileNameOf(filePath),
        language,
        content,
        isUnsaved: false,
      });
      state.activeTabId = id;
    },

    closeTab: (state, action: PayloadAction<string>) => {
      state.openTabs = state.openTabs.filter((t) => t.id !== action.payload);
      reconcileSelection(state, action.payload);
    },

    updateTabContent: (
      state,
      action: PayloadAction<{ tabId: string; content: string }>
    ) => {
      const tab = state.openTabs.find((t) => t.id === action.payload.tabId);
      if (tab) {
        tab.content = action.payload.content;
        tab.isUnsaved = true;
      }
    },

    markTabSaved: (state, action: PayloadAction<string>) => {
      const tab = state.openTabs.find((t) => t.id === action.payload);
      if (tab) {
        tab.isUnsaved = false;
      }
    },

    /** A renamed file keeps its buffer; only its identity changes. */
    renameTabPath: (
      state,
      action: PayloadAction<{ projectId: string; oldPath: string; newPath: string }>
    ) => {
      const { projectId, oldPath, newPath } = action.payload;
      const oldId = tabIdFor(projectId, oldPath);

      for (const tab of state.openTabs) {
        // A folder rename moves every descendant tab with it
        const isMatch = tab.id === oldId || tab.filePath.startsWith(`${oldPath}/`);
        if (tab.projectId !== projectId || !isMatch) continue;

        const nextPath =
          tab.filePath === oldPath
            ? newPath
            : `${newPath}${tab.filePath.slice(oldPath.length)}`;

        const wasActive = state.activeTabId === tab.id;
        const wasSplit = state.splitTabId === tab.id;

        tab.filePath = nextPath;
        tab.fileName = fileNameOf(nextPath);
        tab.id = tabIdFor(projectId, nextPath);

        if (wasActive) state.activeTabId = tab.id;
        if (wasSplit) state.splitTabId = tab.id;
      }
    },

    /** Close tabs for a deleted path, including a folder's descendants. */
    closeTabsUnderPath: (
      state,
      action: PayloadAction<{ projectId: string; path: string }>
    ) => {
      const { projectId, path } = action.payload;

      state.openTabs = state.openTabs.filter(
        (tab) =>
          tab.projectId !== projectId ||
          (tab.filePath !== path && !tab.filePath.startsWith(`${path}/`))
      );

      if (!state.openTabs.some((t) => t.id === state.activeTabId)) {
        state.activeTabId = state.openTabs.length
          ? state.openTabs[state.openTabs.length - 1].id
          : null;
      }
      reconcileSelection(state);
    },

    toggleSplitView: (state) => {
      state.isSplitView = !state.isSplitView;
      state.splitTabId = state.isSplitView
        ? state.openTabs.find((t) => t.id !== state.activeTabId)?.id ?? null
        : null;
    },
  },
});

export const {
  setActiveProjectId,
  setActiveTab,
  openFileTab,
  closeTab,
  updateTabContent,
  markTabSaved,
  renameTabPath,
  closeTabsUnderPath,
  toggleSplitView,
} = projectSlice.actions;

export default projectSlice.reducer;
