import Joi from 'joi';
import { PROJECT_TEMPLATES } from '../types/templates';

/** Validation schemas for Module 4 — Project Management. */

const name = Joi.string().trim().min(1).max(80).messages({
  'string.empty': 'Project name is required.',
  'string.max': 'Project name cannot exceed 80 characters.',
});

const description = Joi.string().trim().max(500).allow('').messages({
  'string.max': 'Description cannot exceed 500 characters.',
});

export const createProjectSchema = Joi.object({
  name: name.required(),
  description: description.default(''),
  template: Joi.string()
    .valid(...PROJECT_TEMPLATES)
    .required()
    .messages({
      'any.only': `Template must be one of: ${PROJECT_TEMPLATES.join(', ')}.`,
      'any.required': 'Project template is required.',
    }),
  visibility: Joi.string().valid('public', 'private').default('private'),
  gitEnabled: Joi.boolean(),
  deploymentEnabled: Joi.boolean(),
});

export const updateProjectSchema = Joi.object({
  name,
  description,
  visibility: Joi.string().valid('public', 'private'),
  gitEnabled: Joi.boolean(),
  deploymentEnabled: Joi.boolean(),
  isFavorite: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update.' });

/** Duplicate takes an optional name; the controller derives one when omitted. */
export const duplicateProjectSchema = Joi.object({
  name: name.optional(),
});

/** List/search filters (SRS Module 4 — Search Projects). */
export const listProjectsQuerySchema = Joi.object({
  search: Joi.string().trim().max(80).allow('').messages({
    'string.max': 'Search term cannot exceed 80 characters.',
  }),
  template: Joi.string().valid(...PROJECT_TEMPLATES),
  favorite: Joi.boolean(),
  // Archived projects are excluded unless explicitly requested (SRS 6.22).
  archived: Joi.boolean().default(false),
  sort: Joi.string().valid('recent', 'name', 'created').default('recent'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

/** Route param guard for every :projectId route. */
export const projectIdParamSchema = Joi.object({
  projectId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid project ID format.',
    'string.length': 'Invalid project ID format.',
  }),
});
