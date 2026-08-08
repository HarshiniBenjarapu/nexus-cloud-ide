import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { setActiveSidebarModule, SidebarModule } from '../../store/uiSlice';
import { FolderTree, GitBranch, Database, Sparkles, Terminal, Rocket, Settings, Search } from 'lucide-react';

interface ActivityItem {
  id: SidebarModule;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const ActivityBar: React.FC = () => {
  const dispatch = useDispatch();
  const { activeSidebarModule, isSidebarCollapsed } = useSelector((state: RootState) => state.ui);

  const items: ActivityItem[] = [
    { id: 'explorer', label: 'File Explorer', icon: <FolderTree className="w-5 h-5" /> },
    { id: 'git', label: 'Source Control (Git)', icon: <GitBranch className="w-5 h-5" />, badge: 3 },
    { id: 'database', label: 'Database Explorer', icon: <Database className="w-5 h-5" /> },
    { id: 'ai', label: 'AI Copilot Assistant', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'terminal', label: 'Shared Web Terminal', icon: <Terminal className="w-5 h-5" /> },
    { id: 'deployments', label: 'One-Click Deployments', icon: <Rocket className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-12 bg-[#0F1115] border-r border-white/10 flex flex-col items-center justify-between py-3 select-none z-20">
      {/* Top Navigation Modules */}
      <div className="flex flex-col space-y-2 w-full px-1.5">
        {items.map((item) => {
          const isActive = activeSidebarModule === item.id && !isSidebarCollapsed;
          return (
            <button
              key={item.id}
              onClick={() => dispatch(setActiveSidebarModule(item.id))}
              title={item.label}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#C58A42]/20 text-[#C58A42] border border-[#C58A42]/40 shadow-lg shadow-[#C58A42]/10'
                  : 'text-[#9DA5B4] hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.badge ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C58A42] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#0F1115]">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Button */}
      <div className="w-full px-1.5">
        <button
          onClick={() => dispatch(setActiveSidebarModule('settings'))}
          title="Workspace Settings"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            activeSidebarModule === 'settings' && !isSidebarCollapsed
              ? 'bg-[#C58A42]/20 text-[#C58A42] border border-[#C58A42]/40'
              : 'text-[#9DA5B4] hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
