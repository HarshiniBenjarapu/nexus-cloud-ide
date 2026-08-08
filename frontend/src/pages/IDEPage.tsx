import React from 'react';
import { TopNav } from '../components/layout/TopNav';
import { ActivityBar } from '../components/layout/ActivityBar';
import { Sidebar } from '../components/layout/Sidebar';
import { MonacoEditorContainer } from '../components/editor/MonacoEditorContainer';
import { BottomPanel } from '../components/panel/BottomPanel';
import { AIPanel } from '../components/ai/AIPanel';
import { Toast } from '../components/ui/Toast';

export const IDEPage: React.FC = () => {
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
      <Toast />
    </div>
  );
};
