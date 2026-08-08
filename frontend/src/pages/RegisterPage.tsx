import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { setUser } from '../store/authSlice';
import { mockUser } from '../services/mockData';
import { Cloud, Lock, Mail, User, Globe, Code } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    dispatch(setUser(mockUser));
    dispatch(showToast({ message: 'Account created! Verification email sent.', type: 'success' }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-screen bg-[#0F1115] text-white flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md p-8 bg-[#171A1F] border border-white/10 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] rounded-2xl text-white shadow-lg shadow-[#C58A42]/20">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Create Nexus Account</h1>
          <p className="text-xs text-[#9DA5B4]">Join the modern cloud development platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('fullName')}
                placeholder="Alex Developer"
                required
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('email')}
                type="email"
                placeholder="alex@nexuside.com"
                required
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Password</label>
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
            Create Account
          </button>
        </form>

        <p className="text-center text-xs text-[#9DA5B4]">
          Already registered?{' '}
          <button onClick={() => navigate('/login')} className="text-[#C58A42] font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
