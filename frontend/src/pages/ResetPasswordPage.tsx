import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/auth.service';
import { Loader2, Lock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { getApiErrorMessage } from '../lib/apiClient';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get('token');
    if (!urlToken) {
      setStatus('error');
      setMessage('Invalid reset link. No token provided.');
    } else {
      setToken(urlToken);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    
    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    
    try {
      await resetPassword({ token, password });
      setStatus('success');
      setMessage('Password has been successfully reset. You can now login with your new password.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(getApiErrorMessage(error) || 'Failed to reset password. The link might be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center text-white p-4">
      <div className="bg-[#171A1F] p-8 rounded-2xl border border-white/10 max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C58A42]/20">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <p className="text-sm text-[#9DA5B4] mt-1">Enter your new password below.</p>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#4CAF50] mx-auto" />
            <p className="text-sm text-white">{message}</p>
            <p className="text-xs text-[#9DA5B4]">Redirecting to login...</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full mt-4 py-2.5 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-[#C58A42]/20"
            >
              Go to Login
            </button>
          </div>
        ) : status === 'error' && !token ? (
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-[#E65A5A] mx-auto" />
            <p className="text-sm text-[#E65A5A]">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full mt-4 py-2.5 bg-[#20242B] hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="p-3 rounded-xl bg-[#E65A5A]/10 border border-[#E65A5A]/20 flex flex-col items-center text-center">
                <span className="text-xs text-[#E65A5A]">{message}</span>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9DA5B4]">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9DA5B4]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42] transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9DA5B4]">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9DA5B4]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42] transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full py-2.5 bg-[#C58A42] hover:bg-[#D69A4E] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#C58A42]/20 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs text-[#9DA5B4] hover:text-white transition-colors"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
