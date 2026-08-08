import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { showToast } from '../../store/uiSlice';
import { setActiveWorkspaceId } from '../../store/workspaceSlice';
import { useCreateWorkspace } from '../../hooks/useWorkspaces';
import { getApiErrorMessage } from '../../lib/apiClient';
import { X, Layers, Loader2 } from 'lucide-react';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(60, 'Workspace name must be 60 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(300, 'Description must be 300 characters or fewer')
    .optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateWorkspaceDialogProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  orgId,
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { mutateAsync, isPending } = useCreateWorkspace(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!isOpen) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      const workspace = await mutateAsync({
        name: values.name,
        description: values.description || undefined,
      });
      dispatch(setActiveWorkspaceId(workspace._id));
      dispatch(showToast({ message: `Workspace "${workspace.name}" created.`, type: 'success' }));
      reset();
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
            <div className="p-2 bg-[#4D8DFF]/10 border border-[#4D8DFF]/30 rounded-xl text-[#4D8DFF]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Create Workspace</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-[#9DA5B4] hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ws-name" className="block text-xs font-medium text-[#9DA5B4]">
              Workspace name
            </label>
            <input
              id="ws-name"
              type="text"
              autoFocus
              {...register('name')}
              placeholder="Platform Team"
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]/60 transition-all"
            />
            {errors.name && <p className="text-[11px] text-[#E65A5A]">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ws-description" className="block text-xs font-medium text-[#9DA5B4]">
              Description <span className="text-[#9DA5B4]/60">(optional)</span>
            </label>
            <textarea
              id="ws-description"
              rows={3}
              {...register('description')}
              placeholder="What is this workspace for?"
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]/60 transition-all resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-[#E65A5A]">{errors.description.message}</p>
            )}
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
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#C58A42] hover:bg-[#D69A4E] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-[#C58A42]/20 flex items-center space-x-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isPending ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
