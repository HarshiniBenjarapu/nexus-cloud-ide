import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../services/auth.service';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getApiErrorMessage } from '../lib/apiClient';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err: any) => {
        setStatus('error');
        setErrorMessage(getApiErrorMessage(err) || 'Failed to verify email.');
      });
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center text-white p-4">
      <div className="bg-[#171A1F] p-8 rounded-2xl border border-white/10 max-w-md w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#C58A42] mx-auto" />
            <h2 className="text-xl font-bold">Verifying Email...</h2>
            <p className="text-sm text-[#9DA5B4]">Please wait while we verify your email address.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-[#4CAF50] mx-auto" />
            <h2 className="text-xl font-bold">Email Verified!</h2>
            <p className="text-sm text-[#9DA5B4]">Your email has been successfully verified. Redirecting to login...</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-[#C58A42] hover:bg-[#D69A4E] rounded-xl text-sm font-medium transition-colors"
            >
              Go to Login Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-[#E65A5A] mx-auto" />
            <h2 className="text-xl font-bold">Verification Failed</h2>
            <p className="text-sm text-[#E65A5A]">{errorMessage}</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};
