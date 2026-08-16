import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { openFileTab, renameTabPath, closeTabsUnderPath } from '../../store/projectSlice';
import { showToast } from '../../store/uiSlice';
import { useProject } from '../../hooks/useProjects';
import {
  useFileTree,
  useCreateEntry,
  useRenameEntry,
  useDuplicateEntry,
  useDeleteEntry,
  useReadFile,
} from '../../hooks/useFiles';
import { useProjectPermissions } from '../../hooks/useProjectPermissions';
import { languageForPath } from '../../services/file.service';
import { getApiErrorMessage } from '../../lib/apiClient';
import { FileNode } from '../../types';
import {
  Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown,
  Plus, FolderPlus, RefreshCw, Loader2, Pencil, Copy, Trash2, Files,
} from 'lucide-react';

/** Right-click target — a node, or the project root when path is ''. */
interface MenuTarget {
  path: string;
  type: 'file' | 'folder';
  x: number;
  y: number;
}

const iconForFile = (name: string) => {
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  if (['tsx', 'ts', 'js', 'jsx', 'mjs', 'cjs'].includes(extension)) {
    return <FileCode className="w-4 h-4 text-[#4D8DFF]" />;
  }
  if (['css', 'scss'].includes(extension)) {
    return <FileCode className="w-4 h-4 text-[#C58A42]" />;
  }
  if (extension === 'json') {
    return <FileText className="w-4 h-4 text-[#F2B94B]" />;
  }
  return <FileText className="w-4 h-4 text-[#9DA5B4]" />;
};

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  activePath: string | null;
  onOpenFile: (node: FileNode) => void;
  onContextMenu: (event: React.MouseEvent, node: FileNode) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node, level, activePath, onOpenFile, onContextMenu,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = node.type === 'file' && node.path === activePath;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen((open) => !open);
    } else {
      onOpenFile(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={(event) => onContextMenu(event, node)}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className={`flex items-center space-x-2 py-1 px-2 hover:bg-white/5 cursor-pointer rounded-md text-xs transition-colors group select-none ${
          isActive ? 'bg-white/10 text-white' : 'text-[#9DA5B4] hover:text-white'
        }`}
      >
        {node.type === 'folder' ? (
          <>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#9DA5B4]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#9DA5B4]" />}
            {isOpen ? <FolderOpen className="w-4 h-4 text-[#C58A42]" /> : <Folder className="w-4 h-4 text-[#C58A42]" />}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {iconForFile(node.name)}
          </>
        )}
        <span className="truncate group-hover:text-white">{node.name}</span>
      </div>

      {node.type === 'folder' && isOpen && node.children ? (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              activePath={activePath}
              onOpenFile={onOpenFile}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const FileExplorerPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { activeProjectId, openTabs, activeTabId } = useSelector(
    (state: RootState) => state.project
  );

  const { project } = useProject(activeProjectId);
  const { tree, memberRole, isLoading, isError, error, refetch, isFetching } =
    useFileTree(activeProjectId);
  const { canEditFiles } = useProjectPermissions(memberRole);

  const readFile = useReadFile(activeProjectId);
  const createEntry = useCreateEntry(activeProjectId);
  const renameEntry = useRenameEntry(activeProjectId);
  const duplicateEntry = useDuplicateEntry(activeProjectId);
  const deleteEntry = useDeleteEntry(activeProjectId);

  const [menu, setMenu] = useState<MenuTarget | null>(null);

  const activePath = openTabs.find((tab) => tab.id === activeTabId)?.filePath ?? null;

  // A click anywhere else dismisses the context menu
  useEffect(() => {
    if (!menu) return;
    const dismiss = () => setMenu(null);
    window.addEventListener('click', dismiss);
    window.addEventListener('contextmenu', dismiss);
    return () => {
      window.removeEventListener('click', dismiss);
      window.removeEventListener('contextmenu', dismiss);
    };
  }, [menu]);

  const fail = (err: unknown) =>
    dispatch(showToast({ message: getApiErrorMessage(err), type: 'error' }));

  const handleOpenFile = async (node: FileNode) => {
    if (!activeProjectId) return;
    try {
      const file = await readFile(node.path);
      dispatch(
        openFileTab({
          projectId: activeProjectId,
          filePath: file.path,
          content: file.content,
          language: languageForPath(file.path),
        })
      );
    } catch (err) {
      fail(err);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ path: node.path, type: node.type, x: event.clientX, y: event.clientY });
  };

  /** Right-clicking empty space targets the project root. */
  const handleRootContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setMenu({ path: '', type: 'folder', x: event.clientX, y: event.clientY });
  };

  const parentOf = (path: string): string => {
    const index = path.lastIndexOf('/');
    return index === -1 ? '' : path.slice(0, index);
  };

  const handleCreate = async (target: MenuTarget, type: 'file' | 'folder') => {
    // Creating from a file means "next to it", from a folder means "inside it"
    const parentPath = target.type === 'folder' ? target.path : parentOf(target.path);
    const name = window.prompt(`New ${type} name`)?.trim();
    if (!name) return;

    try {
      const result = await createEntry.mutateAsync({ parentPath, name, type });
      if (type === 'file') {
        dispatch(
          openFileTab({
            projectId: activeProjectId as string,
            filePath: result.path,
            content: '',
            language: languageForPath(result.path),
          })
        );
      }
      dispatch(showToast({ message: `${result.name} created.`, type: 'success' }));
    } catch (err) {
      fail(err);
    }
  };

  const handleRename = async (target: MenuTarget) => {
    const current = target.path.split('/').pop() ?? '';
    const newName = window.prompt('New name', current)?.trim();
    if (!newName || newName === current) return;

    try {
      const result = await renameEntry.mutateAsync({ path: target.path, newName });
      // Keep any open buffer pointing at the new path
      dispatch(
        renameTabPath({
          projectId: activeProjectId as string,
          oldPath: target.path,
          newPath: result.path,
        })
      );
      dispatch(showToast({ message: `Renamed to ${result.name}.`, type: 'success' }));
    } catch (err) {
      fail(err);
    }
  };

  const handleDuplicate = async (target: MenuTarget) => {
    try {
      const result = await duplicateEntry.mutateAsync({ path: target.path });
      dispatch(showToast({ message: `Duplicated as ${result.name}.`, type: 'success' }));
    } catch (err) {
      fail(err);
    }
  };

  const handleDelete = async (target: MenuTarget) => {
    const label = target.path.split('/').pop() ?? target.path;
    const warning =
      target.type === 'folder'
        ? `Delete "${label}" and everything inside it? This cannot be undone.`
        : `Delete "${label}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;

    try {
      await deleteEntry.mutateAsync(target.path);
      dispatch(
        closeTabsUnderPath({ projectId: activeProjectId as string, path: target.path })
      );
      dispatch(showToast({ message: `${label} deleted.`, type: 'success' }));
    } catch (err) {
      fail(err);
    }
  };

  const handleCopyPath = async (target: MenuTarget) => {
    try {
      await navigator.clipboard.writeText(target.path);
      dispatch(showToast({ message: 'Path copied to clipboard.', type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Could not copy the path.', type: 'error' }));
    }
  };

  if (!activeProjectId) {
    return (
      <div className="flex flex-col h-full bg-[#171A1F] items-center justify-center px-6 text-center">
        <Folder className="w-6 h-6 text-[#9DA5B4]/40 mb-2" />
        <p className="text-xs text-[#9DA5B4]">
          Open a project from the dashboard to browse its files.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none">
      {/* Header Controls */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">Explorer</span>
        <div className="flex items-center space-x-1">
          {canEditFiles && (
            <>
              <button
                onClick={() => handleCreate({ path: '', type: 'folder', x: 0, y: 0 }, 'file')}
                className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg transition-colors"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCreate({ path: '', type: 'folder', x: 0, y: 0 }, 'folder')}
                className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg transition-colors"
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => refetch()}
            className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg transition-colors"
            title="Refresh Tree"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Project Title */}
      <div className="px-3 py-2 text-xs font-bold text-white bg-[#0F1115]/50 border-b border-white/5 truncate">
        {project?.name ?? 'Loading…'}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2" onContextMenu={handleRootContextMenu}>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-[#9DA5B4]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : isError ? (
          <p className="px-3 text-[11px] text-[#E65A5A]">{getApiErrorMessage(error)}</p>
        ) : tree.length === 0 ? (
          <p className="px-3 text-[11px] text-[#9DA5B4]">
            This project has no files yet.
          </p>
        ) : (
          tree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              level={0}
              activePath={activePath}
              onOpenFile={handleOpenFile}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Right-click menu (SRS Module 6 — Right Click Menu) */}
      {menu && (
        <div
          role="menu"
          style={{ top: menu.y, left: menu.x }}
          onClick={(event) => event.stopPropagation()}
          className="fixed z-50 min-w-[180px] py-1 bg-[#20242B] border border-white/10 rounded-xl shadow-2xl text-xs text-[#9DA5B4]"
        >
          {menu.type === 'folder' && canEditFiles && (
            <>
              <button
                onClick={() => { setMenu(null); handleCreate(menu, 'file'); }}
                className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New File</span>
              </button>
              <button
                onClick={() => { setMenu(null); handleCreate(menu, 'folder'); }}
                className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>
            </>
          )}

          {menu.path && (
            <>
              {canEditFiles && (
                <button
                  onClick={() => { setMenu(null); handleRename(menu); }}
                  className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
              )}
              {canEditFiles && (
                <button
                  onClick={() => { setMenu(null); handleDuplicate(menu); }}
                  className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Files className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
              )}
              <button
                onClick={() => { setMenu(null); handleCopyPath(menu); }}
                className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Path</span>
              </button>
              {canEditFiles && (
                <button
                  onClick={() => { setMenu(null); handleDelete(menu); }}
                  className="w-full px-3 py-1.5 flex items-center space-x-2 text-[#E65A5A] hover:bg-[#E65A5A]/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}

          {!canEditFiles && !menu.path && (
            <p className="px-3 py-1.5 text-[11px] text-[#9DA5B4]/70">Read-only access</p>
          )}
        </div>
      )}
    </div>
  );
};
