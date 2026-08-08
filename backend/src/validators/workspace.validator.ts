import Joi from 'joi';

/** Validation schemas for Module 3 — Workspace Management. */

export const createWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).required().messages({
    'string.empty': 'Workspace name is required.',
    'string.max': 'Workspace name cannot exceed 80 characters.',
  }),
  description: Joi.string().trim().max(500).allow('').default('').messages({
    'string.max': 'Description cannot exceed 500 characters.',
  }),
  terminalEnabled: Joi.boolean(),
  aiEnabled: Joi.boolean(),
});

export const updateWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).messages({
    'string.empty': 'Workspace name cannot be empty.',
    'string.max': 'Workspace name cannot exceed 80 characters.',
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Description cannot exceed 500 characters.',
  }),
  terminalEnabled: Joi.boolean(),
  aiEnabled: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update.' });

/** Route param guard for every :workspaceId route. */
export const workspaceIdParamSchema = Joi.object({
  workspaceId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid workspace ID format.',
    'string.length': 'Invalid workspace ID format.',
  }),
});
