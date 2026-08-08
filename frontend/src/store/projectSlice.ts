import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project, FileNode, EditorTab } from '../types';
import { mockProjects, mockFileTree } from '../services/mockData';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  fileTree: FileNode[];
  openTabs: EditorTab[];
  activeTabId: string | null;
  isSplitView: boolean;
  splitTabId: string | null;
}

const initialTabs: EditorTab[] = [
  {
    id: 'tab_app_tsx',
    fileId: 'node_app_tsx',
    filePath: '/src/App.tsx',
    fileName: 'App.tsx',
    language: 'typescript',
    content: mockFileTree[0]?.children?.[0]?.content || '',
    isUnsaved: false,
  },
  {
    id: 'tab_main_tsx',
    fileId: 'node_main_tsx',
    filePath: '/src/main.tsx',
    fileName: 'main.tsx',
    language: 'typescript',
    content: mockFileTree[0]?.children?.[1]?.content || '',
    isUnsaved: false,
  },
];

const initialState: ProjectState = {
  projects: mockProjects,
  activeProject: mockProjects[0],
  fileTree: mockFileTree,
  openTabs: initialTabs,
  activeTabId: 'tab_app_tsx',
  isSplitView: false,
  splitTabId: null,
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveProject: (state, action: PayloadAction<Project>) => {
      state.activeProject = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    openFileTab: (state, action: PayloadAction<{ fileId: string; filePath: string; fileName: string; content: string; language: string }>) => {
      const existing = state.openTabs.find((t) => t.fileId === action.payload.fileId);
      if (existing) {
        state.activeTabId = existing.id;
      } else {
        const newTab: EditorTab = {
          id: `tab_${Date.now()}`,
          fileId: action.payload.fileId,
          filePath: action.payload.filePath,
          fileName: action.payload.fileName,
          language: action.payload.language,
          content: action.payload.content,
          isUnsaved: false,
        };
        state.openTabs.push(newTab);
        state.activeTabId = newTab.id;
      }
    },
    closeTab: (state, action: PayloadAction<string>) => {
      state.openTabs = state.openTabs.filter((t) => t.id !== action.payload);
      if (state.activeTabId === action.payload) {
        state.activeTabId = state.openTabs.length > 0 ? state.openTabs[state.openTabs.length - 1].id : null;
      }
    },
    updateTabContent: (state, action: PayloadAction<{ tabId: string; content: string }>) => {
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
    toggleSplitView: (state) => {
      state.isSplitView = !state.isSplitView;
      if (state.isSplitView && state.openTabs.length > 1) {
        state.splitTabId = state.openTabs.find((t) => t.id !== state.activeTabId)?.id || null;
      } else {
        state.splitTabId = null;
      }
    },
  },
});

export const {
  setActiveProject,
  setActiveTab,
  openFileTab,
  closeTab,
  updateTabContent,
  markTabSaved,
  toggleSplitView,
} = projectSlice.actions;

export default projectSlice.reducer;
