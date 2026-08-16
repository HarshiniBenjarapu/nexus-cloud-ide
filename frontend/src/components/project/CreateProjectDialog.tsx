import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { showToast } from '../../store/uiSlice';
import { useCreateProject } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import { SUPPORTED_TEMPLATES, SupportedTemplate } from '../../types';
import { X, FolderPlus, Loader2 } from 'lucide-react';

/** Mirrors the backend's createProjectSchema so errors surface before the call. */
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(80, 'Project name must be 80 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
  template: z.enum(SUPPORTED_TEMPLATES as [SupportedTemplate, ...SupportedTemplate[]]),
  visibility: z.enum(['private', 'public']),
});

type FormValues = z.infer<typeof schema>;

interface CreateProjectDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onCreated,
}) => {
  const dispatch = useDispatch();
  const { mutateAsync, isPending } = useCreateProject(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { template: 'React', visibility: 'private' },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      const project = await mutateAsync({
        name: values.name,
        description: values.description || undefined,
        template: values.template,
        visibility: values.visibility,
      });
      dispatch(
        showToast({ message: `Project "${project.name}" created.`, type: 'success' })
      );
      reset();
      onClose();
      onCreated?.(project._id);
    } catch (error) {
      dispatch(showToast({ message: getApiErrorMessage(error), type: 'error' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-[#171A1F] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#C58A42]/10 border border-[#C58A42]/30 rounded-xl text-[#C58A42]">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Create Project</h3>
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
            <label htmlFor="proj-name" className="block text-xs font-medium text-[#9DA5B4]">
              Project name
            </label>
            <input
              id="proj-name"
              type="text"
              autoFocus
              {...register('name')}
              placeholder="my-app"
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]/60 transition-all"
            />
            {errors.name && <p className="text-[11px] text-[#E65A5A]">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proj-template" className="block text-xs font-medium text-[#9DA5B4]">
              Template
            </label>
            <select
              id="proj-template"
              {...register('template')}
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#C58A42]/60 transition-all"
            >
              {SUPPORTED_TEMPLATES.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
            {errors.template && (
              <p className="text-[11px] text-[#E65A5A]">{errors.template.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proj-visibility" className="block text-xs font-medium text-[#9DA5B4]">
              Visibility
            </label>
            <select
              id="proj-visibility"
              {...register('visibility')}
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#C58A42]/60 transition-all"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proj-description" className="block text-xs font-medium text-[#9DA5B4]">
              Description <span className="text-[#9DA5B4]/60">(optional)</span>
            </label>
            <textarea
              id="proj-description"
              rows={3}
              {...register('description')}
              placeholder="What does this project do?"
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
              <span>{isPending ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
