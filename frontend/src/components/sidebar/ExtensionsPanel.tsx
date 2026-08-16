import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { extensionService, ExtensionItem } from '../../services/extension.service';
import { Blocks, Search, Star, Download, Check, RefreshCw, Filter } from 'lucide-react';

export const ExtensionsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);

  const fetchExtensions = async () => {
    setIsLoading(true);
    try {
      const data = await extensionService.getExtensions();
      setExtensions(data);
    } catch (err) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleToggleInstall = async (ext: ExtensionItem) => {
    try {
      const updated = await extensionService.toggleInstall(ext.id);
      setExtensions((prev) => prev.map((e) => (e.id === ext.id ? updated : e)));
      dispatch(
        showToast({
          message: updated.installed
            ? `Installed extension ${ext.name}`
            : `Uninstalled extension ${ext.name}`,
          type: updated.installed ? 'success' : 'info',
        })
      );
    } catch (err: any) {
      dispatch(showToast({ message: 'Failed to update extension status', type: 'error' }));
    }
  };

  const categories = ['All', 'Linters', 'Programming Languages', 'Formatters', 'DevOps', 'Source Control'];

  const filteredExtensions = extensions.filter((ext) => {
    const matchesSearch = ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Blocks className="w-4 h-4 text-[#C58A42]" />
          <span>Extensions Marketplace</span>
        </div>
        <button onClick={fetchExtensions} className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Extensions..."
          className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
        />
        <Search className="w-3.5 h-3.5 text-[#9DA5B4] absolute left-2.5 top-2.5" />
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-[10px] rounded-lg whitespace-nowrap border transition-colors ${
              selectedCategory === cat
                ? 'bg-[#C58A42]/20 border-[#C58A42] text-[#C58A42] font-semibold'
                : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredExtensions.map((ext) => (
          <div key={ext.id} className="p-3 bg-[#0F1115] border border-white/5 rounded-xl space-y-2 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">{ext.name}</h4>
                <p className="text-[10px] text-[#9DA5B4]">{ext.publisher} • v{ext.version}</p>
              </div>
              <button
                onClick={() => handleToggleInstall(ext)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 transition-all ${
                  ext.installed
                    ? 'bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/30 hover:bg-[#4CAF50]/25'
                    : 'bg-[#C58A42] text-white hover:bg-[#D69A4E] shadow-sm shadow-[#C58A42]/20'
                }`}
              >
                {ext.installed ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Installed</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    <span>Install</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-[#9DA5B4] line-clamp-2 leading-normal">{ext.description}</p>

            <div className="flex items-center justify-between text-[10px] text-[#9DA5B4] border-t border-white/5 pt-1.5">
              <span className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-[#F2B94B] fill-current" />
                <span>{ext.rating}</span>
              </span>
              <span>{ext.downloads} downloads</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
