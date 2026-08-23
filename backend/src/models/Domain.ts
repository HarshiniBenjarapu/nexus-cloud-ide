import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
  projectId: mongoose.Types.ObjectId;
  domainName: string;
  cnameTarget: string;
  status: 'pending_dns' | 'verified' | 'failed';
  sslStatus: 'issuing' | 'active' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    domainName: { type: String, required: true, trim: true, lowercase: true },
    cnameTarget: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_dns', 'verified', 'failed'],
      default: 'pending_dns',
    },
    sslStatus: {
      type: String,
      enum: ['issuing', 'active', 'revoked'],
      default: 'issuing',
    },
  },
  { timestamps: true }
);

export const Domain = mongoose.model<IDomain>('Domain', DomainSchema);
