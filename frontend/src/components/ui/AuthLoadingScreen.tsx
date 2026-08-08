import React from 'react';
import { Cloud } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

/** Full-screen placeholder shown while auth or permissions are resolving. */
export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Loading…',
}) => (
  <div className="min-h-screen w-screen bg-[#0F1115] flex flex-col items-center justify-center space-y-4 select-none">
    <div className="p-3 bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] rounded-2xl text-white shadow-lg shadow-[#C58A42]/20 animate-pulse">
      <Cloud className="w-8 h-8" />
    </div>
    <p className="text-xs text-[#9DA5B4]">{message}</p>
  </div>
);
