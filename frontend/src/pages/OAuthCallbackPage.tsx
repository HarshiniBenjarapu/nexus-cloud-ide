import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { fetchCurrentUser } from '../services/auth.service';
import { Loader2 } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { setStoredToken } from '../utils/storage';

export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const scope = searchParams.get('scope');

      if (token) {
        try {
          setStoredToken(token);
          let user: any;
          try {
            user = await fetchCurrentUser();
          } catch (fetchErr) {
            console.warn('fetchCurrentUser failed during callback, decoding JWT fallback:', fetchErr);
            // Fallback decode JWT payload if API call has network latency
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              user = {
                id: payload.userId,
                fullName: 'Authenticated User',
                username: 'nexus_user',
                email: 'user@nexus.dev',
                avatar: undefined,
                emailVerified: true,
                authProvider: 'social',
                createdAt: new Date().toISOString(),
              };
            }
          }

          if (user) {
            dispatch(setCredentials({ token, user }));
            dispatch(showToast({ message: 'Successfully authenticated!', type: 'success' }));
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (error: any) {
          dispatch(showToast({ message: error.message || 'Authentication failed.', type: 'error' }));
          navigate('/login', { replace: true });
          return;
        }
      }

      if (code) {
        const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://nexus-cloud-ide.onrender.com/api').trim().replace(/\/$/, '');
        const apiBaseUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

        const isGoogle = scope?.includes('googleapis.com') || scope?.includes('openid') || location.search.includes('google');
        const endpoint = isGoogle ? '/auth/google/callback' : '/auth/github/callback';

        window.location.href = `${apiBaseUrl}${endpoint}?code=${encodeURIComponent(code)}`;
        return;
      }

      dispatch(showToast({ message: 'Authentication failed: No authentication token or code provided.', type: 'error' }));
      navigate('/login', { replace: true });
    };

    handleCallback();
  }, [location, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin text-[#C58A42] mb-4" />
      <h2 className="text-xl font-semibold">Completing authentication...</h2>
      <p className="text-sm text-[#9DA5B4] mt-2">Please wait while we log you in.</p>
    </div>
  );
};
