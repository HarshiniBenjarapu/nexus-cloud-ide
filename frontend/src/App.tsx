import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from './app/store';
import { queryClient } from './lib/queryClient';
import { setUnauthorizedHandler } from './lib/apiClient';
import { AppRoutes } from './routes/AppRoutes';
import { logout } from './store/authSlice';
import { clearWorkspaceSelection } from './store/workspaceSlice';
import { useSessionRestore } from './hooks/useSessionRestore';

/**
 * Lives inside the Router and Redux providers so it can react to an expired
 * session: the Axios interceptor calls the handler registered here, which
 * clears local state and returns the user to /login.
 */
const AppShell: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useSessionRestore();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(logout());
      dispatch(clearWorkspaceSelection());
      queryClient.clear();
      navigate('/login', { replace: true });
    });

    return () => setUnauthorizedHandler(null);
  }, [dispatch, navigate]);

  return <AppRoutes />;
};

export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
