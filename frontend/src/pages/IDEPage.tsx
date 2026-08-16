import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { RootState } from '../app/store';
import { setActiveProjectId } from '../store/projectSlice';
import { useProject } from '../hooks/useProjects';
import { getApiErrorMessage } from '../lib/apiClient';
import { TopNav } from '../components/layout/TopNav';
import { ActivityBar } from '../components/layout/ActivityBar';
import { Sidebar } from '../components/layout/Sidebar';
import { MonacoEditorContainer } from '../components/editor/MonacoEditorContainer';
import { BottomPanel } from '../components/panel/BottomPanel';
import { AIPanel } from '../components/ai/AIPanel';
import { StatusBar } from '../components/layout/StatusBar';
import { QuickOpenDialog } from '../components/editor/QuickOpenDialog';
import { Toast } from '../components/ui/Toast';
import { AuthLoadingScreen } from '../components/ui/AuthLoadingScreen';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export const IDEPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false);

  useEffect(() => {
    if (routeProjectId && routeProjectId !== activeProjectId) {
      dispatch(setActiveProjectId(routeProjectId));
    }
  }, [routeProjectId, activeProjectId, dispatch]);

  const { project, isLoading, isError, error } = useProject(routeProjectId);

  if (!routeProjectId) {
    return activeProjectId ? (
      <Navigate to={`/ide/${activeProjectId}`} replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  if (isLoading) {
    return <AuthLoadingScreen message="Opening your project…" />;
  }

  if (isError || !project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F1115] text-center px-6 space-y-4">
        <div className="p-3 rounded-2xl bg-[#E65A5A]/15 border border-[#E65A5A]/30">
          <AlertTriangle className="w-7 h-7 text-[#E65A5A]" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-white">This project could not be opened</h1>
          <p className="text-xs text-[#9DA5B4] max-w-sm">
            {isError
              ? getApiErrorMessage(error)
              : 'It may have been deleted, or you may no longer have access to it.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 px-4 py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-[#C58A42]/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0F1115] overflow-hidden">
      <TopNav />
      <div className="flex-1 flex overflow-hidden relative">
        <ActivityBar />
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <MonacoEditorContainer />
          <BottomPanel />
        </div>
        <AIPanel />
      </div>
      <StatusBar onOpenQuickOpen={() => setIsQuickOpenOpen(true)} />
      <QuickOpenDialog isOpen={isQuickOpenOpen} onClose={() => setIsQuickOpenOpen(false)} />
      <Toast />
    </div>
  );
};
