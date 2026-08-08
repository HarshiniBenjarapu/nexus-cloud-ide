import { Schema, model, Document, Types } from 'mongoose';

export type OrgMemberRole = 'Owner' | 'Admin' | 'Maintainer' | 'Developer' | 'Viewer';

export interface IOrganizationMember extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: OrgMemberRole;
  invitedBy: Types.ObjectId;
  joinedAt: Date;
}

const orgMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Maintainer', 'Developer', 'Viewer'],
      default: 'Developer',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only belong to an org once
orgMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMember = model<IOrganizationMember>(
  'OrganizationMember',
  orgMemberSchema
);
