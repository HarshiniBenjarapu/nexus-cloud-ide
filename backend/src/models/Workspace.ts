import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspace extends Document {
  organizationId: Types.ObjectId;
  name: string;
  description: string;
  terminalEnabled: boolean;
  aiEnabled: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required.'],
    },
    name: {
      type: String,
      required: [true, 'Workspace name is required.'],
      trim: true,
      maxlength: [80, 'Workspace name cannot exceed 80 characters.'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    terminalEnabled: {
      type: Boolean,
      default: true,
    },
    aiEnabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.index({ organizationId: 1 });
workspaceSchema.index({ createdBy: 1 });

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
