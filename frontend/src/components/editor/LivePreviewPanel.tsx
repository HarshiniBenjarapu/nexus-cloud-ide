import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, RefreshCw, ExternalLink, Shield, Globe } from 'lucide-react';

interface LivePreviewPanelProps {
  url?: string;
  onClose?: () => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  url = 'http://localhost:5174',
  onClose,
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const [inputUrl, setInputUrl] = useState(url);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'w-[375px] h-[667px]';
      case 'tablet':
        return 'w-[768px] h-[900px]';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1115] border-l border-white/10 select-none overflow-hidden">
      {/* Top Address & Viewport Bar */}
      <div className="h-10 bg-[#171A1F] border-b border-white/10 px-3 flex items-center justify-between">
        {/* Device Viewport Mode Toggles */}
        <div className="flex items-center space-x-1 bg-[#0F1115] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`p-1 rounded-lg text-xs transition-colors ${
              viewportMode === 'desktop' ? 'bg-[#C58A42] text-white' : 'text-[#9DA5B4] hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`p-1 rounded-lg text-xs transition-colors ${
              viewportMode === 'tablet' ? 'bg-[#C58A42] text-white' : 'text-[#9DA5B4] hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`p-1 rounded-lg text-xs transition-colors ${
              viewportMode === 'mobile' ? 'bg-[#C58A42] text-white' : 'text-[#9DA5B4] hover:text-white'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-md mx-4 relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-[#4CAF50] absolute left-2.5" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-1 pl-8 pr-8 text-xs text-white font-mono focus:outline-none focus:border-[#C58A42]"
          />
          <button onClick={handleRefresh} className="p-1 text-[#9DA5B4] hover:text-white absolute right-1.5" title="Refresh Live App">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* External Link */}
        <div className="flex items-center space-x-2">
          <a
            href={inputUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-[#9DA5B4] hover:text-white rounded-lg flex items-center space-x-1 text-xs"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onClose && (
            <button onClick={onClose} className="text-[#9DA5B4] hover:text-white p-1 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#171A1F] flex items-center justify-center p-2 overflow-auto">
        <div className={`transition-all duration-200 shadow-2xl rounded-xl overflow-hidden bg-white ${getViewportWidth()}`}>
          <iframe
            key={key}
            src={inputUrl}
            title="Nexus Shared Live Web Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
};
