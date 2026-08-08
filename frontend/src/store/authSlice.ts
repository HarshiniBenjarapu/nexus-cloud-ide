import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { getStoredToken, setStoredToken, clearStoredToken } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  /**
   * True until a stored token has been exchanged for a user via /auth/me.
   * Route guards must wait for this to settle, otherwise a page refresh would
   * bounce an authenticated user to /login.
   */
  isInitializing: boolean;
}

const existingToken = getStoredToken();

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  token: existingToken,
  // Only worth restoring a session if a token survived the reload
  isInitializing: Boolean(existingToken),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** A completed login/registration: token + user arrive together. */
    setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
      setStoredToken(action.payload.token);
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    /** A session restored from a stored token via /auth/me. */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    logout: (state) => {
      clearStoredToken();
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
      state.isInitializing = false;
    },
    /** Session restore finished without producing a valid session. */
    finishInitializing: (state) => {
      state.isInitializing = false;
    },
  },
});

export const { setCredentials, setUser, logout, finishInitializing } = authSlice.actions;
export default authSlice.reducer;
