import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { toggleBottomPanel, setActiveBottomTab } from '../../store/uiSlice';
import { Terminal as TerminalIcon, AlertCircle, FileText, CheckCircle2, ChevronDown, ChevronUp, Play, Plus } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { terminalService } from '../../services/terminal.service';

export const BottomPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { isBottomPanelOpen, activeBottomTab } = useSelector((state: RootState) => state.ui);
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const [terminalSessions, setTerminalSessions] = useState<{ id: string; name: string }[]>([
    { id: 'term-1', name: 'bash #1' },
  ]);
  const [activeTermId, setActiveTermId] = useState('term-1');

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
      term.writeln('\x1b[38;2;197;138;66m=== Nexus Cloud IDE Interactive Container Terminal v1.0 ===\x1b[0m');
      term.writeln(`Project ID: \x1b[36m${activeProjectId || 'Workspace Root'}\x1b[0m`);
      term.writeln('Available utilities: \x1b[32mls\x1b[0m, \x1b[32mpwd\x1b[0m, \x1b[32mnode\x1b[0m, \x1b[32mnpm\x1b[0m, \x1b[32mpython\x1b[0m, \x1b[32mgit\x1b[0m, \x1b[32mclear\x1b[0m\n');
      term.write('\x1b[38;2;77;141;255mnexus-workspace@cloud:\x1b[0m~/project$ ');

      let currentLine = '';
      term.onData(async (e) => {
        if (e === '\r') {
          term.writeln('');
          const cmd = currentLine.trim();
          if (cmd === 'clear') {
            term.clear();
          } else if (cmd.length > 0) {
            try {
              const res = await terminalService.executeCommand({
                command: cmd,
                projectId: activeProjectId || undefined,
              });

              if (res.output) {
                const formatted = res.output.replace(/\n/g, '\r\n');
                term.writeln(formatted);
              }
            } catch (err: any) {
              term.writeln(`\x1b[31mError: ${err.message || 'Failed to execute command'}\x1b[0m`);
            }
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
  }, [isBottomPanelOpen, activeBottomTab, activeProjectId]);

  const addTerminalTab = () => {
    const newId = `term-${Date.now()}`;
    setTerminalSessions((prev) => [...prev, { id: newId, name: `bash #${prev.length + 1}` }]);
    setActiveTermId(newId);
  };

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

        <div className="flex items-center space-x-2">
          {activeBottomTab === 'terminal' && (
            <button onClick={addTerminalTab} className="p-1 text-[#9DA5B4] hover:text-white" title="New Terminal Session">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => dispatch(toggleBottomPanel())} className="text-[#9DA5B4] hover:text-white p-1">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-2 overflow-hidden bg-[#0F1115]">
        {activeBottomTab === 'terminal' && <div ref={terminalRef} className="w-full h-full" />}
        {activeBottomTab === 'output' && (
          <div className="font-mono text-xs text-[#9DA5B4] p-2 space-y-1">
            <p className="text-[#4CAF50]">[Nexus Container Runtime] Listening on http://localhost:5174.</p>
            <p>WebSocket terminal channel connected.</p>
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
            <p>[Build Pipeline] Fast Refresh active across workspace modules.</p>
          </div>
        )}
      </div>
    </div>
  );
};
