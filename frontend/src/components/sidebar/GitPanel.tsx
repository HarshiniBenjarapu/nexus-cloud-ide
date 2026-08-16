import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { showToast } from '../../store/uiSlice';
import { gitService, GitFileStatus } from '../../services/git.service';
import { GitBranch, GitCommit, UploadCloud, DownloadCloud, RefreshCw, Check, Plus } from 'lucide-react';

export const GitPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [files, setFiles] = useState<GitFileStatus[]>([]);

  const fetchStatus = async () => {
    if (!activeProjectId) return;
    setIsLoading(true);
    try {
      const data = await gitService.getStatus(activeProjectId);
      setCurrentBranch(data.currentBranch || 'main');
      setFiles(data.files || []);
    } catch (err) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [activeProjectId]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      dispatch(showToast({ message: 'Please enter a commit message!', type: 'warning' }));
      return;
    }

    setIsCommitting(true);
    try {
      if (activeProjectId) {
        await gitService.commit(activeProjectId, commitMessage);
      }
      setCommitMessage('');
      dispatch(showToast({ message: 'Changes committed successfully!', type: 'success' }));
      fetchStatus();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to commit changes', type: 'error' }));
    } finally {
      setIsCommitting(false);
    }
  };

  const toggleStage = (idx: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, staged: !f.staged } : f))
    );
  };

  const handlePush = () => {
    dispatch(showToast({ message: `Pushing commits to remote origin/${currentBranch}...`, type: 'info' }));
  };

  const handlePull = () => {
    dispatch(showToast({ message: `Pulling latest changes from remote origin/${currentBranch}...`, type: 'info' }));
  };

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <GitBranch className="w-4 h-4 text-[#4CAF50]" />
          <span>Source Control</span>
        </div>
        <button onClick={fetchStatus} className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg" title="Refresh Git Status">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Branch Banner */}
      <div className="flex items-center justify-between p-2.5 bg-[#0F1115] border border-white/5 rounded-xl text-xs">
        <div className="flex items-center space-x-2 text-white font-medium">
          <GitBranch className="w-3.5 h-3.5 text-[#C58A42]" />
          <span>{currentBranch}</span>
        </div>
        <span className="text-[10px] text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded-full font-mono">Ahead +1</span>
      </div>

      {/* Commit Input Box */}
      <div className="space-y-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          className="w-full h-20 bg-[#0F1115] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42] resize-none"
        />
        <button
          onClick={handleCommit}
          disabled={isCommitting}
          className="w-full py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#C58A42]/20"
        >
          {isCommitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
          <span>Commit Changes</span>
        </button>
      </div>

      {/* Push & Pull Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handlePush}
          className="py-1.5 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white flex items-center justify-center space-x-1.5 transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5 text-[#4D8DFF]" />
          <span>Push</span>
        </button>
        <button
          onClick={handlePull}
          className="py-1.5 bg-[#20242B] hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white flex items-center justify-center space-x-1.5 transition-all"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-[#4CAF50]" />
          <span>Pull</span>
        </button>
      </div>

      {/* Changed Files List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider pb-1">Changes ({files.length})</div>
        {files.map((file, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg text-xs text-white group">
            <span className="truncate max-w-[150px] text-[#9DA5B4] group-hover:text-white">{file.path}</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#C58A42]/20 text-[#C58A42] uppercase">{file.status[0]}</span>
              <button
                onClick={() => toggleStage(idx)}
                className={`p-1 rounded ${file.staged ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : 'hover:bg-white/10 text-[#9DA5B4]'}`}
                title={file.staged ? 'Unstage' : 'Stage'}
              >
                {file.staged ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
