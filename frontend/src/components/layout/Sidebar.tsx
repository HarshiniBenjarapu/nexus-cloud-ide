import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { FileExplorerPanel } from '../sidebar/FileExplorerPanel';
import { GitPanel } from '../sidebar/GitPanel';
import { DatabasePanel } from '../sidebar/DatabasePanel';
import { DeploymentsPanel } from '../sidebar/DeploymentsPanel';
import { SettingsPanel } from '../sidebar/SettingsPanel';

export const Sidebar: React.FC = () => {
  const { activeSidebarModule, isSidebarCollapsed } = useSelector((state: RootState) => state.ui);

  if (isSidebarCollapsed) return null;

  return (
    <aside className="w-64 bg-[#171A1F] border-r border-white/10 flex flex-col h-full z-10 transition-all duration-200">
      {activeSidebarModule === 'explorer' && <FileExplorerPanel />}
      {activeSidebarModule === 'git' && <GitPanel />}
      {activeSidebarModule === 'database' && <DatabasePanel />}
      {activeSidebarModule === 'deployments' && <DeploymentsPanel />}
      {activeSidebarModule === 'settings' && <SettingsPanel />}
      {activeSidebarModule === 'ai' && (
        <div className="p-4 text-xs text-[#9DA5B4]">
          <span className="text-white font-semibold">AI Copilot Assistant</span> is active on the right panel.
        </div>
      )}
      {activeSidebarModule === 'terminal' && (
        <div className="p-4 text-xs text-[#9DA5B4]">
          <span className="text-white font-semibold">Shared Terminal</span> is active in the bottom panel.
        </div>
      )}
    </aside>
  );
};
