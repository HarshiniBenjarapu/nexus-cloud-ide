import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { useDuplicateProject, useArchiveProject } from '../../hooks/useProjects';
import { useProjectPermissions } from '../../hooks/useProjectPermissions';
import { getApiErrorMessage } from '../../lib/apiClient';
import { OrgRole, Project } from '../../types';
import {
  MoreVertical, PencilLine, Copy, Archive, ArchiveRestore, Trash2, Loader2,
} from 'lucide-react';

interface ProjectCardMenuProps {
  project: Project;
  workspaceId: string;
  memberRole: OrgRole | null;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

/**
 * Per-card actions for Module 4 — Rename, Duplicate, Archive/Restore, Delete.
 *
 * The card behind this menu opens the IDE on click, so every interactive
 * element here stops propagation; without that, choosing "Delete" would also
 * navigate away.
 */
export const ProjectCardMenu: React.FC<ProjectCardMenuProps> = ({
  project,
  workspaceId,
  memberRole,
  onRename,
  onDelete,
}) => {
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { canContribute, canDeleteProject } = useProjectPermissions(memberRole);
  const duplicateProject = useDuplicateProject(workspaceId);
  const archiveProject = useArchiveProject(workspaceId);

  const isBusy = duplicateProject.isPending || archiveProject.isPending;

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  // A Viewer has no actions at all, so render nothing rather than an empty menu
  if (!canContribute && !canDeleteProject) return null;

  const stop = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDuplicate = async (event: React.MouseEvent) => {
    stop(event);
    setOpen(false);
    try {
      const copy = await duplicateProject.mutateAsync({ projectId: project._id });
      dispatch(showToast({ message: `Duplicated as "${copy.name}".`, type: 'success' }));
    } catch (error) {
      dispatch(showToast({ message: getApiErrorMessage(error), type: 'error' }));
    }
  };

  const handleArchiveToggle = async (event: React.MouseEvent) => {
    stop(event);
    setOpen(false);
    try {
      await archiveProject.mutateAsync({
        projectId: project._id,
        archived: !project.isArchived,
      });
      dispatch(
        showToast({
          message: project.isArchived
            ? `"${project.name}" restored.`
            : `"${project.name}" archived.`,
          type: 'success',
        })
      );
    } catch (error) {
      dispatch(showToast({ message: getApiErrorMessage(error), type: 'error' }));
    }
  };

  const itemClass =
    'w-full px-3 py-2 flex items-center space-x-2.5 text-left hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div ref={containerRef} className="relative" onClick={stop}>
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          setOpen((open) => !open);
        }}
        aria-label={`Actions for ${project.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="p-1 rounded-lg text-[#9DA5B4] hover:text-white hover:bg-white/10 transition-all"
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-40 min-w-[176px] py-1 bg-[#20242B] border border-white/10 rounded-xl shadow-2xl text-xs text-[#9DA5B4]"
        >
          {canContribute && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  stop(event);
                  setOpen(false);
                  onRename(project);
                }}
                className={itemClass}
              >
                <PencilLine className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleDuplicate}
                disabled={isBusy}
                className={itemClass}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleArchiveToggle}
                disabled={isBusy}
                className={itemClass}
              >
                {project.isArchived ? (
                  <>
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </>
                )}
              </button>
            </>
          )}

          {canDeleteProject && (
            <>
              {canContribute && <div className="my-1 border-t border-white/10" />}
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  stop(event);
                  setOpen(false);
                  onDelete(project);
                }}
                className="w-full px-3 py-2 flex items-center space-x-2.5 text-left text-[#E65A5A] hover:bg-[#E65A5A]/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
