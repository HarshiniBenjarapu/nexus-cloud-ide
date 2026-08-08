import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RootState } from '../app/store';
import { useCanAdminister } from '../hooks/useCanAdminister';
import { AuthLoadingScreen } from '../components/ui/AuthLoadingScreen';

/**
 * Gate for authenticated application routes.
 *
 * Waits for session restore to finish before deciding, so a page refresh does
 * not bounce a signed-in user to /login while /auth/me is still in flight.
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (isInitializing) {
    return <AuthLoadingScreen message="Restoring your session…" />;
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

/**
 * Keeps signed-in users off /login and /register.
 */
export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useSelector((state: RootState) => state.auth);

  if (isInitializing) {
    return <AuthLoadingScreen message="Restoring your session…" />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

/**
 * Gate for the platform admin console.
 *
 * Authentication alone is not sufficient — see useCanAdminister for the policy.
 * This deliberately fails closed: a user without a qualifying membership is
 * redirected rather than shown the console.
 */
export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useSelector((state: RootState) => state.auth);
  const { canAdminister, isLoading } = useCanAdminister();

  if (isInitializing) {
    return <AuthLoadingScreen message="Restoring your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <AuthLoadingScreen message="Checking permissions…" />;
  }

  return canAdminister ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
