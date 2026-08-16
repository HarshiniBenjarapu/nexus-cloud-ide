import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { toggleBottomPanel, setActiveBottomTab } from '../../store/uiSlice';
import { GitBranch, CheckCircle2, Cpu } from 'lucide-react';

interface StatusBarProps {
  onOpenQuickOpen: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onOpenQuickOpen }) => {
  const dispatch = useDispatch();
  const { openTabs, activeTabId } = useSelector((state: RootState) => state.project);
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <footer className="h-6 bg-[#171A1F] border-t border-white/10 px-3 flex items-center justify-between text-[11px] text-[#9DA5B4] select-none z-30">
      {/* Left items */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {
            dispatch(setActiveBottomTab('terminal'));
            dispatch(toggleBottomPanel());
          }}
          className="flex items-center space-x-1.5 hover:text-white transition-colors"
        >
          <GitBranch className="w-3 h-3 text-[#4CAF50]" />
          <span>main*</span>
        </button>

        <button
          onClick={() => {
            dispatch(setActiveBottomTab('problems'));
            dispatch(toggleBottomPanel());
          }}
          className="flex items-center space-x-1 hover:text-white transition-colors"
        >
          <CheckCircle2 className="w-3 h-3 text-[#4CAF50]" />
          <span>0 errors, 0 warnings</span>
        </button>

        <button
          onClick={onOpenQuickOpen}
          className="hidden sm:inline-block text-[10px] bg-[#20242B] px-1.5 py-0.5 rounded border border-white/10 text-white/70 hover:text-white"
        >
          Ctrl+P Quick Open
        </button>
      </div>

      {/* Right items */}
      <div className="flex items-center space-x-4 font-mono">
        {activeTab && (
          <>
            <span>Ln 1, Col 1</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span className="uppercase text-[#C58A42] font-semibold">{activeTab.language}</span>
          </>
        )}
        <div className="flex items-center space-x-1 text-[#4D8DFF]">
          <Cpu className="w-3 h-3" />
          <span className="text-[10px]">Cloud IDE Connected</span>
        </div>
      </div>
    </footer>
  );
};
