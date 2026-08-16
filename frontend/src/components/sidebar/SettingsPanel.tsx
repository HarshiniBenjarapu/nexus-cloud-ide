import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { setTheme, showToast } from '../../store/uiSlice';
import { analyticsService, WorkspaceAnalyticsData } from '../../services/analytics.service';
import { Settings, Moon, Trees, Flame, Sun, Eye, Cpu, HardDrive, Zap, Check, Sliders } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { activeTheme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const [analytics, setAnalytics] = useState<WorkspaceAnalyticsData | null>(null);

  // Editor configuration preferences
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState<'JetBrains Mono' | 'Fira Code' | 'Source Code Pro'>('JetBrains Mono');
  const [tabSize, setTabSize] = useState<2 | 4>(2);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsService.getWorkspaceAnalytics('ws-default');
        setAnalytics(data);
      } catch (err) {
        // Fallback
      }
    };
    fetchAnalytics();
  }, [activeProjectId]);

  const themes = [
    { id: 'obsidian', name: 'Obsidian Dark', icon: Moon, color: 'border-[#C58A42] text-[#C58A42] bg-[#C58A42]/15' },
    { id: 'forest', name: 'Forest Dark', icon: Trees, color: 'border-[#4CAF50] text-[#4CAF50] bg-[#4CAF50]/15' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: Flame, color: 'border-[#E65A5A] text-[#E65A5A] bg-[#E65A5A]/15' },
    { id: 'solarized', name: 'Solarized Light', icon: Sun, color: 'border-[#F2B94B] text-[#F2B94B] bg-[#F2B94B]/15' },
    { id: 'highcontrast', name: 'High Contrast', icon: Eye, color: 'border-[#4D8DFF] text-[#4D8DFF] bg-[#4D8DFF]/15' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Settings className="w-4 h-4 text-[#C58A42]" />
          <span>Workspace & Preferences</span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* User Profile Card */}
        <div className="p-3 bg-[#0F1115] border border-white/5 rounded-xl flex items-center space-x-3">
          <img src={user?.avatar} alt={user?.fullName} className="w-9 h-9 rounded-full object-cover border border-[#C58A42]/50" />
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{user?.fullName}</div>
            <div className="text-[10px] text-[#9DA5B4] truncate">{user?.email}</div>
          </div>
        </div>

        {/* Theme System */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Appearance Theme</div>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    dispatch(setTheme(t.id as any));
                    dispatch(showToast({ message: `${t.name} theme activated.`, type: 'info' }));
                  }}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    isSelected ? t.color : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Preferences */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Monaco Editor Settings</div>
          
          {/* Font Family */}
          <div className="space-y-1">
            <label className="text-[11px] text-[#9DA5B4]">Font Family</label>
            <div className="grid grid-cols-3 gap-1">
              {(['JetBrains Mono', 'Fira Code', 'Source Code Pro'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => setFontFamily(font)}
                  className={`py-1 px-1.5 rounded-lg text-[10px] border truncate transition-colors ${
                    fontFamily === font ? 'bg-[#C58A42]/20 border-[#C58A42] text-[#C58A42] font-bold' : 'bg-[#0F1115] border-white/5 text-[#9DA5B4]'
                  }`}
                >
                  {font.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Tab Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#9DA5B4]">
                <span>Font Size</span>
                <span className="text-white font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[#C58A42]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9DA5B4]">Tab Indentation</label>
              <div className="grid grid-cols-2 gap-1">
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setTabSize(size as any)}
                    className={`py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                      tabSize === size ? 'bg-[#4CAF50]/20 border-[#4CAF50] text-[#4CAF50] font-bold' : 'bg-[#0F1115] border-white/5 text-[#9DA5B4]'
                    }`}
                  >
                    {size} spaces
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 bg-[#0F1115] rounded-xl border border-white/5 text-xs text-white">
              <span>Word Wrap</span>
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={`w-8 h-4 rounded-full transition-colors relative ${wordWrap ? 'bg-[#C58A42]' : 'bg-white/20'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${wordWrap ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#0F1115] rounded-xl border border-white/5 text-xs text-white">
              <span>Minimap Overview</span>
              <button
                onClick={() => setMinimap(!minimap)}
                className={`w-8 h-4 rounded-full transition-colors relative ${minimap ? 'bg-[#C58A42]' : 'bg-white/20'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${minimap ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Container Resource Analytics */}
        {analytics && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Container Health & Analytics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#0F1115] border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-[#4D8DFF] text-[10px]">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Storage Used</span>
                </div>
                <div className="font-bold text-white font-mono">{analytics.storageUsedMb} MB / {analytics.storageLimitMb / 1024} GB</div>
              </div>

              <div className="p-2.5 bg-[#0F1115] border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-[#4CAF50] text-[10px]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>RAM Usage</span>
                </div>
                <div className="font-bold text-white font-mono">{analytics.ramUsageMb} MB ({analytics.cpuUsagePct}% CPU)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
