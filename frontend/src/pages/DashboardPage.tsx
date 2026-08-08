import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../app/store';
import { setActiveProject } from '../store/projectSlice';
import { showToast } from '../store/uiSlice';
import { Cloud, Plus, Star, Folder, GitBranch, Play, Layers, Shield, Sparkles, Terminal, HardDrive } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeOrg, workspaces } = useSelector((state: RootState) => state.workspace);
  const { projects } = useSelector((state: RootState) => state.project);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const handleLaunchProject = (proj: any) => {
    dispatch(setActiveProject(proj));
    dispatch(showToast({ message: `Opening ${proj.name} in Nexus Cloud IDE...`, type: 'info' }));
    navigate('/ide');
  };

  const filteredProjects = filter === 'favorites' ? projects.filter((p) => p.isFavorite) : projects;

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <header className="h-16 bg-[#171A1F] border-b border-white/10 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] rounded-xl text-white shadow-lg shadow-[#C58A42]/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Nexus Cloud IDE Dashboard</h1>
            <p className="text-[11px] text-[#9DA5B4]">Organization: {activeOrg?.name || 'Personal Labs'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin')}
            className="px-3.5 py-1.5 bg-[#20242B] hover:bg-white/10 text-xs font-medium text-white border border-white/10 rounded-xl transition-all"
          >
            Admin Dashboard
          </button>

          <button
            onClick={() => navigate('/ide')}
            className="px-4 py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-[#C58A42]/20 flex items-center space-x-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Open IDE Workspace</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 bg-gradient-to-r from-[#171A1F] to-[#20242B] border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Welcome back, {user?.fullName || 'Developer'}! 👋</h2>
            <p className="text-xs text-[#9DA5B4]">
              You have {projects.length} active projects across {workspaces.length} workspaces.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => dispatch(showToast({ message: 'Opening Create Project wizard...', type: 'info' }))}
              className="px-4 py-2.5 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-xs font-medium rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-[#C58A42]/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* System Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#C58A42]/15 text-[#C58A42] rounded-xl border border-[#C58A42]/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{projects.length}</div>
              <div className="text-xs text-[#9DA5B4]">Total Projects</div>
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#4D8DFF]/15 text-[#4D8DFF] rounded-xl border border-[#4D8DFF]/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{workspaces.length}</div>
              <div className="text-xs text-[#9DA5B4]">Workspaces</div>
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#4CAF50]/15 text-[#4CAF50] rounded-xl border border-[#4CAF50]/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Active</div>
              <div className="text-xs text-[#9DA5B4]">Shared Terminal</div>
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#F2B94B]/15 text-[#F2B94B] rounded-xl border border-[#F2B94B]/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">1.2 GB / 10 GB</div>
              <div className="text-xs text-[#9DA5B4]">Cloud Storage Used</div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white">Projects</h3>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  filter === 'all' ? 'bg-[#C58A42] text-white font-medium' : 'text-[#9DA5B4] hover:text-white'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  filter === 'favorites' ? 'bg-[#C58A42] text-white font-medium' : 'text-[#9DA5B4] hover:text-white'
                }`}
              >
                Favorites
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleLaunchProject(proj)}
                className="p-5 bg-[#171A1F] hover:bg-[#20242B] border border-white/10 rounded-2xl space-y-4 cursor-pointer transition-all hover:border-[#C58A42]/50 group shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-[#C58A42]/10 border border-[#C58A42]/30 rounded-xl text-[#C58A42] group-hover:scale-105 transition-transform">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#C58A42] transition-colors">{proj.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#9DA5B4]">{proj.template}</span>
                    </div>
                  </div>

                  <Star className={`w-4 h-4 ${proj.isFavorite ? 'text-[#F2B94B] fill-current' : 'text-[#9DA5B4]/30'}`} />
                </div>

                <p className="text-xs text-[#9DA5B4] line-clamp-2 leading-relaxed">{proj.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#9DA5B4]">
                  <div className="flex items-center space-x-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-[#4CAF50]" />
                    <span>main</span>
                  </div>
                  <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
