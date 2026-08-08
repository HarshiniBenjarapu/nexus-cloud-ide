import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { Shield, Users, Server, Cpu, HardDrive, ArrowLeft, Ban, Trash2, CheckCircle2 } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleAction = (msg: string) => {
    dispatch(showToast({ message: msg, type: 'info' }));
  };

  const usersList = [
    { id: 'usr_101', name: 'Alex Developer', email: 'alex@nexuside.com', role: 'Owner', status: 'Active', storage: '1.2 GB' },
    { id: 'usr_102', name: 'Sarah Engineer', email: 'sarah@nexuside.com', role: 'Developer', status: 'Active', storage: '850 MB' },
    { id: 'usr_103', name: 'Student Account', email: 'user3@university.edu', role: 'Viewer', status: 'Active', storage: '120 MB' },
  ];

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col font-sans select-none">
      <header className="h-16 bg-[#171A1F] border-b border-white/10 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-[#20242B] hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#C58A42]" />
            <h1 className="text-base font-bold text-white tracking-wide">Platform Admin Console</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* System Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9DA5B4]">
              <span>Active Users</span>
              <Users className="w-4 h-4 text-[#4D8DFF]" />
            </div>
            <div className="text-2xl font-bold text-white">42 Active</div>
            <div className="text-[10px] text-[#4CAF50]">10–50 Capacity Target</div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9DA5B4]">
              <span>AI Token Consumption</span>
              <Cpu className="w-4 h-4 text-[#C58A42]" />
            </div>
            <div className="text-2xl font-bold text-white">128.4k</div>
            <div className="text-[10px] text-[#9DA5B4]">OpenAI / Gemini Tokens</div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9DA5B4]">
              <span>System Health</span>
              <Server className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <div className="text-2xl font-bold text-[#4CAF50]">99.98%</div>
            <div className="text-[10px] text-[#4CAF50]">All Node services healthy</div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9DA5B4]">
              <span>Total Object Storage</span>
              <HardDrive className="w-4 h-4 text-[#F2B94B]" />
            </div>
            <div className="text-2xl font-bold text-white">14.8 GB</div>
            <div className="text-[10px] text-[#9DA5B4]">Local FS & Cloudinary</div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Platform Users & Moderation</h2>

          <div className="bg-[#171A1F] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#20242B] text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider border-b border-white/10">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Storage</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold">{u.name} <div className="text-[10px] font-normal text-[#9DA5B4]">{u.email}</div></td>
                    <td className="p-4">{u.role}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#4CAF50]/15 text-[#4CAF50] text-[10px] font-mono border border-[#4CAF50]/30">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#9DA5B4]">{u.storage}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleAction(`Suspended user ${u.name}`)}
                        className="px-2.5 py-1 bg-[#20242B] hover:bg-white/10 text-white rounded-lg border border-white/10 text-[11px]"
                      >
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
