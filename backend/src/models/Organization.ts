import { Schema, model, Document, Types } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  ownerId: Types.ObjectId;
  plan: 'free' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required.'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters.'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'],
    },
    logo: {
      type: String,
      default: null,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are declared inline via unique:true and required:true on field definitions above

export const Organization = model<IOrganization>('Organization', organizationSchema);
