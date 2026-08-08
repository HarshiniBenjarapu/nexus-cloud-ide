import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { mockUser } from '../services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: mockUser, // Default logged-in for instant portfolio preview
  isAuthenticated: true,
  token: 'mock_jwt_token_nexus_2026',
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
