import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { setUser } from '../store/authSlice';
import { mockUser } from '../services/mockData';
import { Cloud, Lock, Mail, Globe, Code } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'alex@nexuside.com',
      password: 'password123',
    },
  });

  const onSubmit = (data: any) => {
    dispatch(setUser(mockUser));
    dispatch(showToast({ message: 'Authentication successful! Welcome to Nexus Cloud IDE.', type: 'success' }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-screen bg-[#0F1115] text-white flex items-center justify-center p-4 font-sans select-none">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('email')}
                type="email"
                required
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#9DA5B4]">Password</label>
              <a href="#" className="text-[11px] text-[#C58A42] hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('password')}
                type="password"
                required
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-[#C58A42]/20"
          >
            Sign In
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#171A1F] px-3 text-[10px] text-[#9DA5B4] uppercase tracking-wider">Or continue with</span>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSubmit({})}
            className="py-2.5 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center space-x-2 transition-colors"
          >
            <Code className="w-4 h-4 text-[#C58A42]" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => onSubmit({})}
            className="py-2.5 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center space-x-2 transition-colors"
          >
            <Globe className="w-4 h-4 text-[#4D8DFF]" />
            <span>Google</span>
          </button>
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
