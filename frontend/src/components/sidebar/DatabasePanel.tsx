import React from 'react';
import { useDispatch } from 'react-redux';
import { mockDatabases } from '../../services/mockData';
import { showToast } from '../../store/uiSlice';
import { Database, Plus, Play, Table, ShieldCheck, RefreshCw } from 'lucide-react';

export const DatabasePanel: React.FC = () => {
  const dispatch = useDispatch();

  const handleTestConnection = (name: string) => {
    dispatch(showToast({ message: `Testing proxy connection to ${name}... Connected!`, type: 'success' }));
  };

  const handleExecuteQuery = (name: string) => {
    dispatch(showToast({ message: `Executing sample query on ${name}...`, type: 'info' }));
  };

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Database className="w-4 h-4 text-[#C58A42]" />
          <span>Database Explorer</span>
        </div>
        <button
          onClick={() => dispatch(showToast({ message: 'Opening Add Database Connection dialog...', type: 'info' }))}
          className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg"
          title="Connect Database"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {mockDatabases.map((db) => (
          <div key={db.id} className="p-3 bg-[#0F1115] border border-white/5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{db.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4CAF50]/15 text-[#4CAF50] font-mono border border-[#4CAF50]/30">
                {db.provider}
              </span>
            </div>

            <div className="text-[11px] text-[#9DA5B4] font-mono truncate">
              {db.host}:{db.port} / {db.databaseName}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleTestConnection(db.name)}
                className="flex items-center space-x-1 text-[11px] text-[#4D8DFF] hover:underline"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Test Link</span>
              </button>

              <button
                onClick={() => handleExecuteQuery(db.name)}
                className="flex items-center space-x-1 px-2 py-1 bg-[#20242B] hover:bg-white/10 text-white text-[10px] rounded-lg transition-colors"
              >
                <Play className="w-2.5 h-2.5 text-[#4CAF50]" />
                <span>Run Query</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
