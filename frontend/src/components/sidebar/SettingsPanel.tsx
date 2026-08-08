import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { setTheme, showToast } from '../../store/uiSlice';
import { Settings, Sliders, Moon, Trees, Shield, User } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { activeTheme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Settings className="w-4 h-4 text-[#C58A42]" />
          <span>Workspace Preferences</span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* User Card */}
        <div className="p-3 bg-[#0F1115] border border-white/5 rounded-xl flex items-center space-x-3">
          <img src={user?.avatar} alt={user?.fullName} className="w-9 h-9 rounded-full object-cover border border-[#C58A42]/50" />
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{user?.fullName}</div>
            <div className="text-[10px] text-[#9DA5B4] truncate">{user?.email}</div>
          </div>
        </div>

        {/* Theme System */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Appearance Theme</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                dispatch(setTheme('obsidian'));
                dispatch(showToast({ message: 'Obsidian dark theme active.', type: 'info' }));
              }}
              className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 transition-all ${
                activeTheme === 'obsidian'
                  ? 'bg-[#C58A42]/20 border-[#C58A42] text-[#C58A42]'
                  : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Obsidian</span>
            </button>

            <button
              onClick={() => {
                dispatch(setTheme('forest'));
                dispatch(showToast({ message: 'Forest dark theme active.', type: 'info' }));
              }}
              className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 transition-all ${
                activeTheme === 'forest'
                  ? 'bg-[#4CAF50]/20 border-[#4CAF50] text-[#4CAF50]'
                  : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
              }`}
            >
              <Trees className="w-4 h-4" />
              <span>Forest</span>
            </button>
          </div>
        </div>

        {/* Editor Preferences */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Editor Settings</div>
          <div className="space-y-2 text-xs text-white">
            <div className="flex items-center justify-between p-2 bg-[#0F1115] rounded-xl border border-white/5">
              <span>Auto-Save Interval</span>
              <span className="font-mono text-[#C58A42] text-[11px]">3000ms</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#0F1115] rounded-xl border border-white/5">
              <span>Font Size</span>
              <span className="font-mono text-[#4D8DFF] text-[11px]">14px</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#0F1115] rounded-xl border border-white/5">
              <span>Tab Size</span>
              <span className="font-mono text-[#4CAF50] text-[11px]">2 spaces</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
