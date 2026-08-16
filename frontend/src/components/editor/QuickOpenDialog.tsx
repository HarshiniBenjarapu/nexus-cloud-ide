import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { openFileTab } from '../../store/projectSlice';
import { useFileTree, useReadFile } from '../../hooks/useFiles';
import { languageForPath } from '../../services/file.service';
import { FileNode } from '../../types';
import { Search, FileCode, X } from 'lucide-react';

interface QuickOpenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickOpenDialog: React.FC<QuickOpenDialogProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const { tree } = useFileTree(activeProjectId);
  const readFile = useReadFile(activeProjectId);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      }
      if (node.children) {
        result = result.concat(flattenFiles(node.children));
      }
    }
    return result;
  };

  const allFiles = flattenFiles(tree);
  const filteredFiles = allFiles.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectFile = async (file: FileNode) => {
    if (!activeProjectId) return;
    try {
      const fileData = await readFile(file.path);
      dispatch(
        openFileTab({
          projectId: activeProjectId,
          filePath: file.path,
          content: fileData.content,
          language: languageForPath(file.path),
        })
      );
    } catch (err) {
      // Fallback
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 select-none">
      <div className="w-full max-w-xl bg-[#171A1F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-white/10 flex items-center space-x-3 bg-[#0F1115]">
          <Search className="w-4 h-4 text-[#C58A42]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a file name to open... (e.g. App.tsx, server.ts)"
            className="flex-1 bg-transparent text-sm text-white placeholder-[#9DA5B4]/50 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-[#9DA5B4] hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#9DA5B4]">No matching files found.</div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleSelectFile(file)}
                className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <FileCode className="w-4 h-4 text-[#4D8DFF]" />
                  <span className="text-xs text-white font-medium group-hover:text-[#C58A42] transition-colors">
                    {file.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#9DA5B4] font-mono">{file.path}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
