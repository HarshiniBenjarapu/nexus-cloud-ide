import { Schema, model, Document, Types } from 'mongoose';

/**
 * ProjectFile — metadata for a file inside a project (SRS 6.10).
 *
 * File CONTENT is not stored here (SRS 5.7). The bytes live on the file system
 * via services/storage.service.ts; this collection records the metadata the SRS
 * requires (size, owner, timestamps) so it can be queried without touching disk.
 *
 * The on-disk tree remains the source of truth for structure; this collection is
 * kept in step by the file controller.
 */
export interface IProjectFile extends Document {
  projectId: Types.ObjectId;
  name: string;
  path: string;
  parentFolder: string;
  type: 'file' | 'folder';
  extension: string;
  size: number;
  createdBy: Types.ObjectId;
  lastModifiedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectFileSchema = new Schema<IProjectFile>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required.'],
    },
    name: {
      type: String,
      required: [true, 'File name is required.'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters.'],
    },
    // Project-relative POSIX path, e.g. 'src/App.tsx'. Never absolute.
    path: {
      type: String,
      required: [true, 'File path is required.'],
      maxlength: [1024, 'File path cannot exceed 1024 characters.'],
    },
    // Empty string means the project root.
    parentFolder: {
      type: String,
      default: '',
      maxlength: [1024, 'Folder path cannot exceed 1024 characters.'],
    },
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    extension: {
      type: String,
      default: '',
      maxlength: [40, 'Extension cannot exceed 40 characters.'],
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

projectFileSchema.index({ projectId: 1, path: 1 }, { unique: true });
projectFileSchema.index({ projectId: 1, parentFolder: 1 });

export const ProjectFile = model<IProjectFile>('ProjectFile', projectFileSchema);
