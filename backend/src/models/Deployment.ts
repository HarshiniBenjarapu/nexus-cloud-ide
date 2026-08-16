import mongoose, { Schema, Document } from 'mongoose';

export interface IDeployment extends Document {
  projectId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  provider: 'vercel' | 'netlify' | 'render' | 'aws_container';
  status: 'queued' | 'building' | 'deployed' | 'failed';
  liveUrl?: string;
  buildLogs: string[];
  envVars?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: {
      type: String,
      enum: ['vercel', 'netlify', 'render', 'aws_container'],
      default: 'vercel',
    },
    status: {
      type: String,
      enum: ['queued', 'building', 'deployed', 'failed'],
      default: 'queued',
    },
    liveUrl: { type: String },
    buildLogs: [{ type: String }],
    envVars: { type: Map, of: String },
  },
  { timestamps: true }
);

export const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);
