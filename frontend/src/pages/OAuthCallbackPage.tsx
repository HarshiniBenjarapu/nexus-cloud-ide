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

      if (!token) {
        dispatch(showToast({ message: 'Authentication failed: No token provided.', type: 'error' }));
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Temporarily store the token so the API client can use it for fetchCurrentUser
        setStoredToken(token);
        const user = await fetchCurrentUser();
        
        dispatch(setCredentials({ token, user }));
        dispatch(showToast({ message: 'Successfully authenticated with GitHub!', type: 'success' }));
        navigate('/dashboard', { replace: true });
      } catch (error) {
        dispatch(showToast({ message: 'Authentication failed. Please try again.', type: 'error' }));
        navigate('/login', { replace: true });
      }
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
