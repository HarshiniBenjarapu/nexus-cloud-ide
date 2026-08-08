import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { openFileTab } from '../../store/projectSlice';
import { FileNode } from '../../types';
import { Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown, Plus, FolderPlus, RefreshCw } from 'lucide-react';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);

  const getFileIcon = (ext?: string) => {
    if (ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx') {
      return <FileCode className="w-4 h-4 text-[#4D8DFF]" />;
    }
    if (ext === 'css') {
      return <FileCode className="w-4 h-4 text-[#C58A42]" />;
    }
    if (ext === 'json') {
      return <FileText className="w-4 h-4 text-[#F2B94B]" />;
    }
    return <FileText className="w-4 h-4 text-[#9DA5B4]" />;
  };

  const handleFileClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      const languageMap: Record<string, string> = {
        tsx: 'typescript',
        ts: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        css: 'css',
        json: 'json',
        md: 'markdown',
      };

      dispatch(
        openFileTab({
          fileId: node.id,
          filePath: node.path,
          fileName: node.name,
          content: node.content || '',
          language: languageMap[node.extension || ''] || 'plaintext',
        })
      );
    }
  };

  return (
    <div>
      <div
        onClick={handleFileClick}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className="flex items-center space-x-2 py-1 px-2 hover:bg-white/5 cursor-pointer rounded-md text-xs text-[#9DA5B4] hover:text-white transition-colors group select-none"
      >
        {node.type === 'folder' ? (
          <>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#9DA5B4]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#9DA5B4]" />}
            {isOpen ? <FolderOpen className="w-4 h-4 text-[#C58A42]" /> : <Folder className="w-4 h-4 text-[#C58A42]" />}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {getFileIcon(node.extension)}
          </>
        )}
        <span className="truncate group-hover:text-white">{node.name}</span>
      </div>

      {node.type === 'folder' && isOpen && node.children ? (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const FileExplorerPanel: React.FC = () => {
  const { fileTree, activeProject } = useSelector((state: RootState) => state.project);

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none">
      {/* Header Controls */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">Explorer</span>
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg transition-colors" title="New File">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg transition-colors" title="New Folder">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg transition-colors" title="Refresh Tree">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project Title */}
      <div className="px-3 py-2 text-xs font-bold text-white bg-[#0F1115]/50 border-b border-white/5 truncate">
        {activeProject?.name || 'nexus-project'}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree.map((node) => (
          <FileTreeItem key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
};
