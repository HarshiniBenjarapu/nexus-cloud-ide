import Joi from 'joi';
import { ASSIGNABLE_ROLES } from '../types/roles';

/** Validation schemas for Module 2 — Organization Management. */

export const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Organization name is required.',
    'string.min': 'Organization name must be at least 2 characters.',
    'string.max': 'Organization name cannot exceed 100 characters.',
  }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(60)
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      'string.empty': 'Organization slug is required.',
      'string.pattern.base':
        'Slug can only contain lowercase letters, numbers, and hyphens.',
    }),
});

export const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Organization name must be at least 2 characters.',
    'string.max': 'Organization name cannot exceed 100 characters.',
  }),
  logo: Joi.string().trim().uri().allow(null, '').messages({
    'string.uri': 'Logo must be a valid URL.',
  }),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update.' });

export const inviteMemberSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required to invite a member.',
    'string.email': 'Please provide a valid email address.',
  }),
  // 'Owner' is absent by design — see types/roles.ts
  role: Joi.string()
    .valid(...ASSIGNABLE_ROLES)
    .default('Developer')
    .messages({
      'any.only': `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`,
    }),
});

/** Route param guard for every :orgId route. */
export const orgIdParamSchema = Joi.object({
  orgId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid organization ID format.',
    'string.length': 'Invalid organization ID format.',
  }),
});
