import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import workspaceReducer from '../store/workspaceSlice';
import projectReducer from '../store/projectSlice';
import uiReducer from '../store/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    project: projectReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
