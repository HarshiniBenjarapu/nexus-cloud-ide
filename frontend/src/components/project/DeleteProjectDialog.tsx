import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { useDeleteProject } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import { Project } from '../../types';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteProjectDialogProps {
  workspaceId: string;
  project: Project | null;
  onClose: () => void;
  /** Fired after a successful delete so callers can clear IDE selection. */
  onDeleted?: (projectId: string) => void;
}

/**
 * Deleting is a soft delete on the server, but nothing in the app can bring a
 * deleted project back — so this is treated as irreversible and asks the user
 * to type the name. Archive is offered as the recoverable alternative.
 */
export const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  workspaceId,
  project,
  onClose,
  onDeleted,
}) => {
  const dispatch = useDispatch();
  const { mutateAsync, isPending } = useDeleteProject(workspaceId);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    setConfirmText('');
  }, [project]);

  if (!project) return null;

  const isConfirmed = confirmText.trim() === project.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    try {
      await mutateAsync(project._id);
      dispatch(showToast({ message: `Project "${project.name}" deleted.`, type: 'success' }));
      onDeleted?.(project._id);
      onClose();
    } catch (error) {
      dispatch(showToast({ message: getApiErrorMessage(error), type: 'error' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-[#171A1F] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#E65A5A]/10 border border-[#E65A5A]/30 rounded-xl text-[#E65A5A]">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Delete Project</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-[#9DA5B4] hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start space-x-3 p-3.5 bg-[#E65A5A]/8 border border-[#E65A5A]/25 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-[#E65A5A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#9DA5B4] leading-relaxed">
              <span className="text-white font-medium">{project.name}</span> and its files will be
              removed from this workspace. Nexus Cloud IDE cannot restore a deleted project — if you
              might need it later, archive it instead.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="delete-proj-confirm" className="block text-xs font-medium text-[#9DA5B4]">
              Type <span className="text-white font-mono">{project.name}</span> to confirm
            </label>
            <input
              id="delete-proj-confirm"
              type="text"
              autoFocus
              autoComplete="off"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#E65A5A]/60 transition-all"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#9DA5B4] hover:text-white rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || !isConfirmed}
              className="px-4 py-2 bg-[#E65A5A] hover:bg-[#F06A6A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-[#E65A5A]/20 flex items-center space-x-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isPending ? 'Deleting...' : 'Delete Project'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
