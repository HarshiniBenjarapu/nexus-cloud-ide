import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SidebarModule = 'explorer' | 'git' | 'database' | 'ai' | 'terminal' | 'deployments' | 'extensions' | 'settings';

interface UIState {
  activeSidebarModule: SidebarModule;
  isSidebarCollapsed: boolean;
  isBottomPanelOpen: boolean;
  activeBottomTab: 'terminal' | 'output' | 'problems' | 'logs';
  isAIPanelOpen: boolean;
  activeTheme: 'obsidian' | 'forest' | 'cyberpunk' | 'solarized' | 'highcontrast';
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;
}

const initialState: UIState = {
  activeSidebarModule: 'explorer',
  isSidebarCollapsed: false,
  isBottomPanelOpen: true,
  activeBottomTab: 'terminal',
  isAIPanelOpen: true,
  activeTheme: 'obsidian',
  toast: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveSidebarModule: (state, action: PayloadAction<SidebarModule>) => {
      if (state.activeSidebarModule === action.payload && !state.isSidebarCollapsed) {
        state.isSidebarCollapsed = true;
      } else {
        state.activeSidebarModule = action.payload;
        state.isSidebarCollapsed = false;
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    toggleBottomPanel: (state) => {
      state.isBottomPanelOpen = !state.isBottomPanelOpen;
    },
    setActiveBottomTab: (state, action: PayloadAction<'terminal' | 'output' | 'problems' | 'logs'>) => {
      state.activeBottomTab = action.payload;
      state.isBottomPanelOpen = true;
    },
    toggleAIPanel: (state) => {
      state.isAIPanelOpen = !state.isAIPanelOpen;
    },
    showToast: (state, action: PayloadAction<{ message: string; type?: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type || 'info',
        visible: true,
      };
    },
    hideToast: (state) => {
      if (state.toast) {
        state.toast.visible = false;
      }
    },
    setTheme: (state, action: PayloadAction<'obsidian' | 'forest' | 'cyberpunk' | 'solarized' | 'highcontrast'>) => {
      state.activeTheme = action.payload;
    },
  },
});

export const {
  setActiveSidebarModule,
  toggleSidebar,
  toggleBottomPanel,
  setActiveBottomTab,
  toggleAIPanel,
  showToast,
  hideToast,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
