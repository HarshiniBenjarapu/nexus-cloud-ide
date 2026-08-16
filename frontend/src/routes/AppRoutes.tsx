import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { IDEPage } from '../pages/IDEPage';
import { AdminPage } from '../pages/AdminPage';
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from './guards';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public — redirected away once signed in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated application */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* The project id lives in the URL so a reload or a shared link
            reopens the same project (SRS Module 7). */}
        <Route path="/ide/:projectId" element={<IDEPage />} />
        <Route path="/ide" element={<IDEPage />} />
      </Route>

      {/* Admin console — authentication is not sufficient on its own */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* Unauthenticated visitors land on /login via ProtectedRoute */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
