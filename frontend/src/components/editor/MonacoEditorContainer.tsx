import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { setActiveTab, closeTab, updateTabContent, toggleSplitView } from '../../store/projectSlice';
import Editor, { OnChange } from '@monaco-editor/react';
import { X, Columns, Code2, Save } from 'lucide-react';

export const MonacoEditorContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { openTabs, activeTabId, isSplitView, splitTabId } = useSelector((state: RootState) => state.project);
  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const splitTab = openTabs.find((t) => t.id === splitTabId);

  const handleEditorChange: OnChange = (value) => {
    if (activeTabId && value !== undefined) {
      dispatch(updateTabContent({ tabId: activeTabId, content: value }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1115] overflow-hidden select-none">
      {/* Tabs Header Bar */}
      <div className="h-9 bg-[#171A1F] border-b border-white/10 flex items-center justify-between px-2 overflow-x-auto">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => dispatch(setActiveTab(tab.id))}
                className={`group flex items-center space-x-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t-2 transition-all ${
                  isActive
                    ? 'bg-[#0F1115] border-[#C58A42] text-white font-medium'
                    : 'bg-transparent border-transparent text-[#9DA5B4] hover:text-white hover:bg-white/5'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-[#4D8DFF]" />
                <span className="truncate max-w-[120px]">{tab.fileName}</span>
                {tab.isUnsaved ? (
                  <span className="w-2 h-2 rounded-full bg-[#F2B94B]" title="Unsaved changes" />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(closeTab(tab.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-white text-[#9DA5B4] p-0.5 rounded transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Split View Toggle */}
        <button
          onClick={() => dispatch(toggleSplitView())}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            isSplitView ? 'bg-[#C58A42]/20 border-[#C58A42] text-[#C58A42]' : 'border-white/10 text-[#9DA5B4] hover:text-white'
          }`}
          title="Toggle Split View"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab ? (
          <div className="flex-1 h-full">
            <Editor
              height="100%"
              theme="vs-dark"
              language={activeTab.language}
              value={activeTab.content}
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: true },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                wordWrap: 'on',
                tabSize: 2,
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#9DA5B4] space-y-3">
            <Code2 className="w-12 h-12 text-[#C58A42]/40" />
            <p className="text-sm">Select a file from the Explorer to start editing</p>
          </div>
        )}

        {/* Split Editor Pane */}
        {isSplitView && splitTab ? (
          <div className="flex-1 h-full border-l border-white/10">
            <div className="h-6 bg-[#171A1F] border-b border-white/10 px-3 text-[11px] text-[#9DA5B4] flex items-center justify-between">
              <span>Split: {splitTab.fileName}</span>
            </div>
            <Editor
              height="100%"
              theme="vs-dark"
              language={splitTab.language}
              value={splitTab.content}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                automaticLayout: true,
                readOnly: false,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
