import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { setActiveWorkspaceId, setActiveOrgId } from '../../store/workspaceSlice';
import { toggleAIPanel, showToast } from '../../store/uiSlice';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { useLogout } from '../../hooks/useAuth';
import { Cloud, Play, Rocket, Share2, Sparkles, ChevronDown, GitBranch, Layers, LogOut } from 'lucide-react';

export const TopNav: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { organizations, activeOrg } = useOrganizations();
  const { workspaces, activeWorkspace } = useWorkspaces(activeOrg?._id);
  const { activeProject } = useSelector((state: RootState) => state.project);
  const { isAIPanelOpen } = useSelector((state: RootState) => state.ui);

  const handleRun = () => {
    dispatch(showToast({ message: `Executing ${activeProject?.name || 'Project'} in background container...`, type: 'info' }));
  };

  const handleDeploy = () => {
    dispatch(showToast({ message: 'Triggering One-Click Vercel Deployment...', type: 'success' }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    dispatch(showToast({ message: 'Workspace link copied to clipboard!', type: 'success' }));
  };

  const logout = useLogout();

  const handleLogout = () => {
    logout();
    dispatch(showToast({ message: 'Signed out successfully.', type: 'info' }));
  };

  return (
    <header className="h-14 bg-[#171A1F] border-b border-white/10 px-4 flex items-center justify-between select-none z-30">
      {/* Left Brand & Workspace Selector */}
      <div className="flex items-center space-x-4">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] flex items-center justify-center text-white shadow-lg shadow-[#C58A42]/20">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-white tracking-wide">Nexus Cloud IDE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#C58A42]/20 text-[#C58A42] border border-[#C58A42]/30">v1.0</span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 hidden sm:block" />

        {/* Organization & Workspace Selector */}
        <div className="flex items-center space-x-2">
          {/* Org Selector */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#20242B] hover:bg-white/5 border border-white/10 rounded-xl text-xs text-white transition-all">
              <Layers className="w-3.5 h-3.5 text-[#C58A42]" />
              <span className="truncate max-w-[110px]">{activeOrg?.name || 'Organization'}</span>
              <ChevronDown className="w-3 h-3 text-[#9DA5B4]" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#20242B] border border-white/10 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Organizations</div>
              {organizations.map((org) => (
                <button
                  key={org._id}
                  onClick={() => dispatch(setActiveOrgId(org._id))}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#C58A42]/20 flex items-center justify-between ${
                    org._id === activeOrg?._id ? 'text-[#C58A42] font-semibold' : 'text-white'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  <span className="text-[10px] text-[#9DA5B4]">{org.memberCount} members</span>
                </button>
              ))}
            </div>
          </div>

          <span className="text-white/20 text-xs">/</span>

          {/* Workspace Selector */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#20242B] hover:bg-white/5 border border-white/10 rounded-xl text-xs text-white transition-all">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
              <span className="truncate max-w-[130px]">{activeWorkspace?.name || 'Workspace'}</span>
              <ChevronDown className="w-3 h-3 text-[#9DA5B4]" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#20242B] border border-white/10 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Workspaces</div>
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => dispatch(setActiveWorkspaceId(ws._id))}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#C58A42]/20 flex items-center justify-between ${
                    ws._id === activeWorkspace?._id ? 'text-[#C58A42] font-semibold' : 'text-white'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Active Project & Git Branch Status */}
      <div className="hidden md:flex items-center space-x-3 bg-[#0F1115] px-3 py-1 rounded-xl border border-white/5">
        <span className="text-xs font-semibold text-white">{activeProject?.name || 'nexus-project'}</span>
        <span className="text-white/20">•</span>
        <div className="flex items-center space-x-1 text-xs text-[#9DA5B4]">
          <GitBranch className="w-3 h-3 text-[#4CAF50]" />
          <span>main</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Run Button */}
        <button
          onClick={handleRun}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#4CAF50]/15 hover:bg-[#4CAF50]/25 text-[#4CAF50] border border-[#4CAF50]/30 rounded-xl text-xs font-medium transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Run</span>
        </button>

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-medium rounded-xl text-xs transition-all shadow-md shadow-[#C58A42]/20"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Deploy</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 bg-[#20242B] hover:bg-white/10 text-[#9DA5B4] hover:text-white border border-white/10 rounded-xl transition-all"
          title="Share Workspace"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* AI Toggle */}
        <button
          onClick={() => dispatch(toggleAIPanel())}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
            isAIPanelOpen
              ? 'bg-[#C58A42]/20 border-[#C58A42]/50 text-[#C58A42]'
              : 'bg-[#20242B] border-white/10 text-[#9DA5B4] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">AI Copilot</span>
        </button>

        {/* User Profile */}
        <div className="relative group flex items-center space-x-2 pl-2 border-l border-white/10">
          <button className="flex items-center" title={user?.fullName || 'Account'}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.fullName || 'User'}
              className="w-7 h-7 rounded-full border border-[#C58A42]/50 object-cover"
            />
          </button>
          <div className="absolute top-full right-0 mt-1 w-52 bg-[#20242B] border border-white/10 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-[#9DA5B4] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#E65A5A]/20 hover:text-[#E65A5A] flex items-center space-x-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
