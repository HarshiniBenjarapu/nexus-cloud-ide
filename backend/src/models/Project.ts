import { Schema, model, Document, Types } from 'mongoose';
import { PROJECT_TEMPLATES, ProjectTemplate } from '../types/templates';

/**
 * Project — a software application inside a workspace (SRS 2.10 / 6.9).
 *
 * Source code is NOT stored here (SRS 5.7). MongoDB holds metadata only; the
 * files themselves live on the file system in development (SRS 5.8) and are
 * managed through services/storage.service.ts.
 */
export interface IProject extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  description: string;
  template: ProjectTemplate;
  language: string;
  visibility: 'public' | 'private';
  gitEnabled: boolean;
  deploymentEnabled: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace reference is required.'],
    },
    name: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
      maxlength: [80, 'Project name cannot exceed 80 characters.'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    template: {
      type: String,
      enum: PROJECT_TEMPLATES,
      required: [true, 'Project template is required.'],
    },
    language: {
      type: String,
      default: '',
      maxlength: [40, 'Language cannot exceed 40 characters.'],
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    gitEnabled: {
      type: Boolean,
      default: false,
    },
    deploymentEnabled: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    // Archived projects stay listed but are filtered out of the default view
    // (SRS 6.22 data lifecycle: Active → Archived → Soft Deleted).
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Soft delete (SRS 6.21). Null means the project is live.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ workspaceId: 1, deletedAt: 1 });
projectSchema.index({ createdBy: 1 });
// Two live projects in one workspace may not share a name
projectSchema.index(
  { workspaceId: 1, name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

export const Project = model<IProject>('Project', projectSchema);
