import React from 'react';
import { useDispatch } from 'react-redux';
import { mockDeployments } from '../../services/mockData';
import { showToast } from '../../store/uiSlice';
import { Rocket, ExternalLink, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

export const DeploymentsPanel: React.FC = () => {
  const dispatch = useDispatch();

  const handleTriggerDeploy = () => {
    dispatch(showToast({ message: 'Deployment pipeline initiated on Vercel Edge Network...', type: 'info' }));
  };

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Rocket className="w-4 h-4 text-[#C58A42]" />
          <span>One-Click Deployments</span>
        </div>
      </div>

      <button
        onClick={handleTriggerDeploy}
        className="w-full py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#C58A42]/20"
      >
        <Rocket className="w-3.5 h-3.5" />
        <span>Deploy Active Project</span>
      </button>

      <div className="space-y-3 flex-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Recent Builds</div>
        {mockDeployments.map((dep) => (
          <div key={dep.id} className="p-3 bg-[#0F1115] border border-white/5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{dep.projectName}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4CAF50]/15 text-[#4CAF50] font-mono border border-[#4CAF50]/30 flex items-center space-x-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{dep.status}</span>
              </span>
            </div>

            <div className="text-[10px] text-[#9DA5B4] flex items-center justify-between">
              <span>Provider: {dep.provider}</span>
              <span>{new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {dep.liveUrl ? (
              <a
                href={dep.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-2.5 py-1.5 bg-[#20242B] hover:bg-white/10 rounded-lg text-xs text-[#4D8DFF] transition-colors"
              >
                <span className="truncate max-w-[160px] text-[11px]">{dep.liveUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
