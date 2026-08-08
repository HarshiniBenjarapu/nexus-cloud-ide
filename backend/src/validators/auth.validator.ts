import Joi from 'joi';

/**
 * Validation schemas for Module 1 — Authentication.
 * Password complexity is configurable per SRS 3 (Module 1, Password Security).
 */

export const MIN_PASSWORD_LENGTH = 8;

export const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.min': 'Full name must be at least 2 characters.',
    'string.max': 'Full name cannot exceed 100 characters.',
  }),
  username: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.empty': 'Username is required.',
      'string.min': 'Username must be at least 3 characters.',
      'string.max': 'Username cannot exceed 30 characters.',
      'string.pattern.base':
        'Username can only contain letters, numbers, underscores, and hyphens.',
    }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email address is required.',
    'string.email': 'Please provide a valid email address.',
  }),
  password: Joi.string().min(MIN_PASSWORD_LENGTH).max(128).required().messages({
    'string.empty': 'Password is required.',
    'string.min': `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    'string.max': 'Password cannot exceed 128 characters.',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email address is required.',
    'string.email': 'Please provide a valid email address.',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.',
  }),
});
