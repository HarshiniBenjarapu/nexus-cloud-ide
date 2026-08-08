import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { toggleBottomPanel, setActiveBottomTab } from '../../store/uiSlice';
import { Terminal as TerminalIcon, AlertCircle, FileText, CheckCircle2, ChevronDown, ChevronUp, X, Play } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

export const BottomPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { isBottomPanelOpen, activeBottomTab } = useSelector((state: RootState) => state.ui);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);

  useEffect(() => {
    if (isBottomPanelOpen && activeBottomTab === 'terminal' && terminalRef.current && !xtermInstance.current) {
      const term = new XTerm({
        theme: {
          background: '#0F1115',
          foreground: '#FFFFFF',
          cursor: '#C58A42',
          selectionBackground: 'rgba(197, 138, 66, 0.3)',
        },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        cursorBlink: true,
        rows: 8,
      });

      term.open(terminalRef.current);
      term.writeln('\x1b[38;2;197;138;66m=== Nexus Cloud IDE Shared Web Terminal v1.0 ===\x1b[0m');
      term.writeln('Connected to containerized workspace bash environment.');
      term.writeln('Type commands below (e.g. \x1b[32mnpm run dev\x1b[0m, \x1b[32mpython main.py\x1b[0m, \x1b[32mgit status\x1b[0m):\n');
      term.write('\x1b[38;2;77;141;255mnexus-workspace@cloud:\x1b[0m~/project$ ');

      let currentLine = '';
      term.onData((e) => {
        if (e === '\r') {
          term.writeln('');
          if (currentLine.trim() === 'clear') {
            term.clear();
          } else if (currentLine.trim() === 'npm run dev') {
            term.writeln('\x1b[32m> nexus-dashboard-v2@1.0.0 dev\x1b[0m');
            term.writeln('\x1b[32m> vite\x1b[0m\n');
            term.writeln('  \x1b[1mVITE v5.4.2\x1b[0m  ready in \x1b[1m280\x1b[0m ms\n');
            term.writeln('  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[36mhttp://localhost:5173/\x1b[0m');
          } else if (currentLine.trim().length > 0) {
            term.writeln(`Executed: ${currentLine}`);
          }
          currentLine = '';
          term.write('\x1b[38;2;77;141;255mnexus-workspace@cloud:\x1b[0m~/project$ ');
        } else if (e === '\u007F') {
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else {
          currentLine += e;
          term.write(e);
        }
      });

      xtermInstance.current = term;
    }
  }, [isBottomPanelOpen, activeBottomTab]);

  if (!isBottomPanelOpen) {
    return (
      <div className="h-7 bg-[#171A1F] border-t border-white/10 px-4 flex items-center justify-between select-none">
        <button
          onClick={() => dispatch(toggleBottomPanel())}
          className="flex items-center space-x-2 text-xs text-[#9DA5B4] hover:text-white"
        >
          <TerminalIcon className="w-3.5 h-3.5 text-[#C58A42]" />
          <span>Terminal (bash)</span>
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-56 bg-[#0F1115] border-t border-white/10 flex flex-col select-none">
      {/* Header Tabs */}
      <div className="h-8 bg-[#171A1F] border-b border-white/10 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={() => dispatch(setActiveBottomTab('terminal'))}
            className={`flex items-center space-x-1.5 py-1 transition-colors ${
              activeBottomTab === 'terminal' ? 'text-[#C58A42] font-semibold border-b-2 border-[#C58A42]' : 'text-[#9DA5B4] hover:text-white'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => dispatch(setActiveBottomTab('output'))}
            className={`flex items-center space-x-1.5 py-1 transition-colors ${
              activeBottomTab === 'output' ? 'text-[#C58A42] font-semibold border-b-2 border-[#C58A42]' : 'text-[#9DA5B4] hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Output</span>
          </button>

          <button
            onClick={() => dispatch(setActiveBottomTab('problems'))}
            className={`flex items-center space-x-1.5 py-1 transition-colors ${
              activeBottomTab === 'problems' ? 'text-[#C58A42] font-semibold border-b-2 border-[#C58A42]' : 'text-[#9DA5B4] hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#4CAF50]" />
            <span>Problems (0)</span>
          </button>

          <button
            onClick={() => dispatch(setActiveBottomTab('logs'))}
            className={`flex items-center space-x-1.5 py-1 transition-colors ${
              activeBottomTab === 'logs' ? 'text-[#C58A42] font-semibold border-b-2 border-[#C58A42]' : 'text-[#9DA5B4] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Build Logs</span>
          </button>
        </div>

        <button onClick={() => dispatch(toggleBottomPanel())} className="text-[#9DA5B4] hover:text-white p-1">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-2 overflow-hidden bg-[#0F1115]">
        {activeBottomTab === 'terminal' && <div ref={terminalRef} className="w-full h-full" />}
        {activeBottomTab === 'output' && (
          <div className="font-mono text-xs text-[#9DA5B4] p-2 space-y-1">
            <p className="text-[#4CAF50]">[Nexus Output Engine] Runtime listening on port 5173.</p>
            <p>Hot Module Replacement (HMR) connected.</p>
          </div>
        )}
        {activeBottomTab === 'problems' && (
          <div className="flex items-center space-x-2 text-xs text-[#4CAF50] p-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>No TypeScript linting errors or compilation warnings detected.</span>
          </div>
        )}
        {activeBottomTab === 'logs' && (
          <div className="font-mono text-xs text-[#9DA5B4] p-2 space-y-1">
            <p>[Build Pipeline] Initialized Docker runtime container node:20-alpine.</p>
            <p>[Build Pipeline] Bundling assets with Vite production plugin.</p>
          </div>
        )}
      </div>
    </div>
  );
};
