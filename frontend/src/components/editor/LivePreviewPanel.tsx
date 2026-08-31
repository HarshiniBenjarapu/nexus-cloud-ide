import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Smartphone, Tablet, Monitor, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { terminalService } from '../../services/terminal.service';

interface LivePreviewPanelProps {
  url?: string;
  projectId?: string;
  workspaceId?: string;
  onClose?: () => void;
}

const DEFAULT_PREVIEW_URL =
  (typeof window !== 'undefined' && (import.meta as any).env?.VITE_PREVIEW_BASE_URL)
    ? `${(import.meta as any).env.VITE_PREVIEW_BASE_URL.replace(/\/$/, '')}:5174`
    : 'http://localhost:5174';

const normalizePreviewUrl = (candidate: string, fallback = DEFAULT_PREVIEW_URL): string => {
  const trimmed = candidate.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
      return new URL(withProtocol).toString();
    } catch {
      return fallback;
    }
  }
};

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  url = DEFAULT_PREVIEW_URL,
  projectId,
  workspaceId,
  onClose,
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const [inputUrl, setInputUrl] = useState(() => normalizePreviewUrl(url));
  const [previewStatus, setPreviewStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const autoStartAttemptedRef = useRef(false);

  useEffect(() => {
    setInputUrl((previous) => normalizePreviewUrl(url, previous));
  }, [url]);

  const previewUrl = useMemo(() => normalizePreviewUrl(inputUrl), [inputUrl]);

  useEffect(() => {
    let cancelled = false;

    setPreviewStatus('checking');

    const probe = async () => {
      try {
        await fetch(previewUrl, {
          mode: 'no-cors',
          cache: 'no-store',
        });
        if (!cancelled) {
          setPreviewStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setPreviewStatus('error');
        }
      }
    };

    probe();

    return () => {
      cancelled = true;
    };
  }, [previewUrl, key]);

  useEffect(() => {
    if (!projectId || !workspaceId || autoStartAttemptedRef.current) return;

    autoStartAttemptedRef.current = true;

    const startProject = async () => {
      try {
        const started = await terminalService.startProjectRuntime({ workspaceId, projectId });
        if (started.url) {
          setInputUrl(started.url);
          setKey((prev) => prev + 1);
        }
      } catch {
        // Swallow and let the user see the preview unavailable state.
      }
    };

    startProject();
  }, [projectId, workspaceId]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleApplyUrl = () => {
    const nextUrl = normalizePreviewUrl(inputUrl);
    setInputUrl(nextUrl);
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
      <div className="h-10 bg-[#171A1F] border-b border-white/10 px-3 flex items-center justify-between">
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

        <div className="flex-1 max-w-md mx-4 relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-[#4CAF50] absolute left-2.5" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyUrl();
              }
            }}
            className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-1 pl-8 pr-8 text-xs text-white font-mono focus:outline-none focus:border-[#C58A42]"
            aria-label="Preview URL"
          />
          <button onClick={handleApplyUrl} className="p-1 text-[#9DA5B4] hover:text-white absolute right-1.5" title="Refresh Live App">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-[#9DA5B4] hover:text-white rounded-lg flex items-center space-x-1 text-xs"
            title="Open in new window"
            onClick={(e) => {
              if (!previewUrl) {
                e.preventDefault();
              }
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onClose && (
            <button onClick={onClose} className="text-[#9DA5B4] hover:text-white p-1 text-xs" aria-label="Close preview">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[#171A1F] flex items-center justify-center p-2 overflow-auto relative">
        {previewStatus !== 'ready' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#101418]/90 backdrop-blur-[1px] px-6 text-center">
            <div className="max-w-sm space-y-2 rounded-2xl border border-[#C58A42]/30 bg-[#0F1115]/90 p-4 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C58A42]">
                {previewStatus === 'checking' ? 'Checking preview…' : 'Preview unavailable'}
              </p>
              <p className="text-sm text-[#E5E7EB]">
                {previewStatus === 'checking'
                  ? 'Waiting for the project to start on a local dev server.'
                  : 'The app is not running yet. Start the project server and then reload this preview.'}
              </p>
              <p className="text-[11px] text-[#9DA5B4]">
                Try running <span className="font-mono text-[#F8FAFC]">npm run dev</span> in the project root and open the local URL shown above.
              </p>
            </div>
          </div>
        )}

        <div className={`transition-all duration-200 shadow-2xl rounded-xl overflow-hidden bg-white ${getViewportWidth()} ${previewStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
          <iframe
            key={key}
            src={previewUrl}
            title="Nexus Shared Live Web Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onLoad={() => setPreviewStatus('ready')}
            onError={() => setPreviewStatus('error')}
          />
        </div>
      </div>
    </div>
  );
};
