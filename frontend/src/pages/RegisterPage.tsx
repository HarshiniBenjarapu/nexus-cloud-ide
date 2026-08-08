import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { useRegister } from '../hooks/useAuth';
import { Cloud, Lock, Mail, User, AtSign } from 'lucide-react';

// Mirrors the backend registerSchema so users get the same rules client-side
const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username cannot exceed 30 characters.')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens.'
    ),
  email: z
    .string()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password cannot exceed 128 characters.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', username: '', email: '', password: '' },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        dispatch(
          showToast({
            message: 'Account created! Welcome to Nexus Cloud IDE.',
            type: 'success',
          })
        );
      },
      onError: (error: Error) => {
        dispatch(showToast({ message: error.message, type: 'error' }));
      },
    });
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('fullName')}
                placeholder="Alex Developer"
                autoComplete="name"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-[#E65A5A]">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Username</label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('username')}
                placeholder="alexdev"
                autoComplete="username"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
            {errors.username && (
              <p className="text-[11px] text-[#E65A5A]">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('email')}
                type="email"
                placeholder="alex@nexuside.com"
                autoComplete="email"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
            {errors.email && <p className="text-[11px] text-[#E65A5A]">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#C58A42]"
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-[#E65A5A]">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full py-3 bg-[#C58A42] hover:bg-[#D69A4E] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-[#C58A42]/20"
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
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
