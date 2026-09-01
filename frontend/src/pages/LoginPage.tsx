import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { useLogin } from '../hooks/useAuth';
import { socialLogin } from '../services/auth.service';
import { setCredentials } from '../store/authSlice';
import { Cloud, Lock, Mail, Globe, Code } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const login = useLogin();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isGooglePending, setIsGooglePending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data, {
      onSuccess: () => {
        dispatch(
          showToast({
            message: 'Authentication successful! Welcome to Nexus Cloud IDE.',
            type: 'success',
          })
        );
      },
      onError: (error: Error) => {
        dispatch(showToast({ message: error.message, type: 'error' }));
      },
    });
  };

  const handleGoogleClick = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback`);
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
    } else {
      setShowGoogleModal(true);
    }
  };

  const executeGoogleSSO = async (emailToUse?: string, nameToUse?: string) => {
    const targetEmail = (emailToUse || googleEmail).trim();
    if (!targetEmail) {
      dispatch(showToast({ message: 'Please enter your Google account email.', type: 'error' }));
      return;
    }

    setIsGooglePending(true);
    try {
      const fullName = (nameToUse || googleName).trim() || targetEmail.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetEmail)}`;

      const res = await socialLogin({
        provider: 'google',
        email: targetEmail,
        fullName,
        avatar,
      });

      dispatch(setCredentials({ token: res.token, user: res.user }));
      dispatch(
        showToast({
          message: `Logged in as ${res.user.fullName} (${res.user.email})`,
          type: 'success',
        })
      );
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Google authentication failed.', type: 'error' }));
    } finally {
      setIsGooglePending(false);
    }
  };

  const handleGitHubOAuth = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liqvOkBmJN8NFxCW';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  };

  return (
    <div className="min-h-screen w-screen bg-[#0F1115] text-white flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Google Sign-In Account Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#171A1F] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-[#9DA5B4] hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#4D8DFF]/10 rounded-xl border border-[#4D8DFF]/20 text-[#4D8DFF]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Account Sign In</h3>
                <p className="text-xs text-[#9DA5B4]">Sign in with your Google email address</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeGoogleSSO();
              }}
              className="space-y-3 pt-1"
            >
              <div className="space-y-1">
                <label className="text-xs text-[#9DA5B4]">Google Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="your.name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#4D8DFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#9DA5B4]">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#4D8DFF]"
                />
              </div>

              <button
                type="submit"
                disabled={isGooglePending || !googleEmail.trim()}
                className="w-full py-3 bg-[#4D8DFF] hover:bg-[#3B7BEB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-[#4D8DFF]/20 mt-2"
              >
                {isGooglePending ? 'Signing in…' : 'Continue with Google Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-[#171A1F] border border-white/10 rounded-2xl shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] rounded-2xl text-white shadow-lg shadow-[#C58A42]/20">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Sign in to Nexus IDE</h1>
          <p className="text-xs text-[#9DA5B4]">Unified Cloud Development Ecosystem</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
              />
            </div>
            {errors.email && <p className="text-[11px] text-[#E65A5A]">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#9DA5B4]">Password</label>
              <span
                className="text-[11px] text-[#9DA5B4]/50"
                title="Password reset is coming soon"
              >
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-[#E65A5A]">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full py-3 bg-[#C58A42] hover:bg-[#D69A4E] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-[#C58A42]/20"
          >
            {login.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#171A1F] px-3 text-[10px] text-[#9DA5B4] uppercase tracking-wider">Or continue with</span>
        </div>

        {/* Social Authentication */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGitHubOAuth}
              className="py-2.5 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Code className="w-4 h-4 text-[#C58A42]" />
              <span>GitHub</span>
            </button>
            <button
              type="button"
              disabled={isGooglePending}
              onClick={handleGoogleClick}
              className="py-2.5 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <Globe className="w-4 h-4 text-[#4D8DFF]" />
              <span>{isGooglePending ? 'Signing in...' : 'Google'}</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#9DA5B4]">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-[#C58A42] font-semibold hover:underline">
            Register now
          </button>
        </p>
      </div>
    </div>
  );
};
